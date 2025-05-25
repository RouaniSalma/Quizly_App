import google.generativeai as genai
import json
import re
import random
import time
import logging
from typing import Dict, Optional
from django.conf import settings
from django.core.cache import cache

# Configuration du logging
logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            'gemini-1.5-flash',
            generation_config={
                'temperature': 0.5,  # Plus factuel pour un quiz académique
                'top_p': 0.8,
                'top_k': 20,
                'max_output_tokens': 2000  # Optimisé pour réduire les coûts
            }
        )

    def _truncate_text(self, text: str, max_words: int = 1500) -> str:
        """Tronque le texte à un nombre maximal de mots"""
        words = text.split()
        return ' '.join(words[:max_words])

    def generate_quiz_from_text(self, text: str, difficulty: str = "medium") -> Optional[Dict]:
        """
        Génère un quiz avec EXACTEMENT 3 questions basées sur le texte fourni.
        """
        # Vérification du cache
        cache_key = f"quiz_{hash(text)}_{difficulty}"
        cached_quiz = cache.get(cache_key)
        if cached_quiz:
            logger.info("Quiz récupéré depuis le cache")
            return cached_quiz

        # Tronquage du texte
        safe_text = self._truncate_text(text)

        # Prompt optimisé avec exemple
        prompt = f"""Tu es un expert en création de quiz pédagogiques. Crée un quiz en JSON avec EXACTEMENT 3 questions.

Exemple de sortie attendue :
{{
  "title": "Quiz sur la Révolution Française",
  "description": "Questions sur les événements clés",
  "questions": [
    {{
      "question": "Quand a eu lieu la prise de la Bastille ?",
      "options": ["5 mai 1789", "14 juillet 1789", "26 août 1789", "21 janvier 1793"],
      "correct_answer": 1,
      "explanation": "La Bastille a été prise le 14 juillet 1789 (référence: ligne 12 du texte)"
    }}
  ]
}}

Règles ABSOLUES :
- EXACTEMENT 3 QUESTIONS
- Difficulté: {difficulty.lower()}
- 4 options par question
- Réponses correctes aléatoirement réparties
- Une seule réponse correcte par question
- Questions BASÉES sur le texte ci-dessous
- Inclure un détail du texte dans les explications
- Format JSON PUR (pas de ```json)

Texte source :
{safe_text}
"""

        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                response = self.model.generate_content(prompt)
                quiz_data = self._parse_response(response.text)

                # Validation
                if self._validate_quiz(quiz_data, safe_text):
                    cache.set(cache_key, quiz_data, timeout=86400)  # Cache 24h
                    return quiz_data

            except Exception as e:
                logger.error(f"Tentative {attempt + 1} échouée : {str(e)}")
                time.sleep(1)  # Délai anti-rate limit

        logger.warning("Échec après %d tentatives", max_attempts)
        return None

    def _parse_response(self, response_text: str) -> Dict:
        """Nettoie et parse la réponse JSON"""
        cleaned = re.sub(r'^```(json)?|```$', '', response_text.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r'//.*?$', '', cleaned, flags=re.MULTILINE)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise ValueError("Aucun JSON valide trouvé")

    def _validate_quiz(self, quiz_data: Dict, source_text: str) -> bool:
        """Valide la structure ET la pertinence du quiz"""
        try:
            # Validation structurelle
            if not isinstance(quiz_data.get('questions'), list):
                raise ValueError("Format de questions invalide")

            if len(quiz_data['questions']) != 3:
                raise ValueError(f"3 questions requises (reçu: {len(quiz_data['questions'])})")

            for i, q in enumerate(quiz_data['questions'], 1):
                if not all(key in q for key in ['question', 'options', 'correct_answer', 'explanation']):
                    raise ValueError(f"Question {i} incomplète")

                if len(q['options']) != 4:
                    raise ValueError(f"Question {i} doit avoir 4 options")

                if q['correct_answer'] not in {0, 1, 2, 3}:
                    raise ValueError(f"Question {i}: réponse doit être entre 0 et 3")

                # Validation de la pertinence
                if not self._is_question_relevant(q['question'], source_text):
                    raise ValueError(f"Question {i} hors sujet")

            return True

        except ValueError as e:
            logger.warning(f"Quiz invalide : {e}")
            return False

    def _is_question_relevant(self, question: str, source_text: str) -> bool:
        """Vérifie que la question est liée au texte source"""
        keywords = set(word.lower() for word in source_text.split()[:20] if len(word) > 4)
        question_words = set(word.lower() for word in question.split() if len(word) > 3)
        return len(keywords & question_words) >= 2  # Au moins 2 mots-clés en commun

    def _ensure_answer_distribution(self, quiz_data: Dict):
        """Rééquilibre les positions des réponses correctes"""
        positions = [q['correct_answer'] for q in quiz_data['questions']]
        if max(positions.count(i) for i in range(4)) > 2:  # Si une position domine
            logger.info("Rééquilibrage des réponses...")
            for q in quiz_data['questions']:
                options = q['options']
                correct_text = options[q['correct_answer']]
                random.shuffle(options)
                q['correct_answer'] = options.index(correct_text)