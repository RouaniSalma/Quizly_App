import google.generativeai as genai
import json
import re
import random
import time
import logging
from typing import Dict, Optional
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            'gemini-1.5-flash',
            generation_config={
                'temperature': 0.5,
                'top_p': 0.8,
                'top_k': 20,
                'max_output_tokens': 2500  # Augmenté pour 5 questions
            }
        )

    def _truncate_text(self, text: str, max_words: int = 2000) -> str:
        """Tronque le texte à un nombre maximal de mots"""
        words = text.split()
        return ' '.join(words[:max_words])

    def _check_daily_quota(self) -> bool:
        """Vérifie si le quota quotidien n'est pas atteint"""
        today = time.strftime("%Y-%m-%d")
        daily_key = f"gemini_daily_{today}"
        daily_count = cache.get(daily_key, 0)  # Retourne 0 si la clé n'existe pas
        
        # Garder 50 requêtes de marge
        if daily_count >= 1450:
            logger.warning(f"Quota quotidien atteint: {daily_count}/1500")
            return False
        return True

    def _increment_daily_quota(self):
        """Incrémente le compteur de quota quotidien"""
        today = time.strftime("%Y-%m-%d")
        daily_key = f"gemini_daily_{today}"
        
        # Initialiser la clé si elle n'existe pas
        if not cache.get(daily_key):
            cache.set(daily_key, 0, timeout=86400)  # 24h
        
        cache.incr(daily_key, 1)
        
        # Log pour monitoring
        current_count = cache.get(daily_key, 0)
        if current_count % 100 == 0:  # Log tous les 100 appels
            logger.info(f"Quota quotidien: {current_count}/1500")

    def _find_similar_cached_quiz(self, text: str, difficulty: str) -> Optional[Dict]:
        """Trouve un quiz similaire déjà généré"""
        # Hash du début du texte (plus stable)
        text_start = text[:500]
        cache_key = f"quiz_start_{hash(text_start)}_{difficulty}"
        
        return cache.get(cache_key)

    def generate_quiz_from_text(self, text: str, difficulty: str = "medium") -> Optional[Dict]:
        """
        Génère un quiz avec EXACTEMENT 5 questions basées sur le texte fourni.
        """
        # Vérifier le quota quotidien AVANT tout
        if not self._check_daily_quota():
            logger.warning("Quota quotidien atteint, retour None")
            return None  # Retourner None au lieu du fallback
        
        # Cache ultra-agressif (30 jours)
        cache_key = f"quiz_{hash(text)}_{difficulty}"
        cached_quiz = cache.get(cache_key)
        if cached_quiz:
            logger.info("Quiz trouvé dans le cache")
            return cached_quiz
        
        # Chercher du contenu similaire
        similar_quiz = self._find_similar_cached_quiz(text, difficulty)
        if similar_quiz:
            logger.info("Quiz similaire trouvé dans le cache")
            return similar_quiz

        safe_text = self._truncate_text(text)

        prompt = f"""Tu es un expert en création de quiz pédagogiques. Crée un quiz en JSON avec EXACTEMENT 5 questions.

Règles ABSOLUES :
1. Structure REQUISE :
{{
  "title": "Titre du quiz",
  "description": "Description concise",
  "questions": [
    {{
      "question": "Question claire et précise",
      "options": ["Option1", "Option2", "Option3", "Option4"],
      "correct_answer": INDEX_ALEATOIRE_0_3,
      "explanation": "Explication pédagogique avec référence au texte"
    }}
  ]
}}

2. Contraintes :
- EXACTEMENT 5 QUESTIONS
- Difficulté: {difficulty.lower()}
- 4 options par question
- Une seule réponse correcte par question
- Chaque question DOIT explicitement faire référence au texte ci-dessous
- Les explications doivent citer un passage spécifique du texte
- Format JSON PUR (pas de ```json)

3. Texte source :
{safe_text}
"""

        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                response = self.model.generate_content(prompt)
                quiz_data = self._parse_response(response.text)

                if self._validate_quiz(quiz_data, safe_text):
                    # Cache de 30 jours au lieu de 1 jour
                    cache.set(cache_key, quiz_data, timeout=2592000)
                    # Incrémenter le compteur de quota
                    self._increment_daily_quota()
                    return quiz_data

            except Exception as e:
                logger.error(f"Tentative {attempt + 1} échouée : {str(e)}")
                time.sleep(1)

        logger.error("Échec après %d tentatives", max_attempts)
        return None  # Retourner None au lieu du fallback

    def _parse_response(self, response_text: str) -> Dict:
        """Nettoie et parse la réponse JSON"""
        cleaned = re.sub(r'^```(json)?|```$', '', response_text.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r'//.*?$', '', cleaned, flags=re.MULTILINE)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Erreur de parsing JSON : {e}\nTexte: {cleaned}")
            raise ValueError("Format JSON invalide")

    def _validate_quiz(self, quiz_data: Dict, source_text: str) -> bool:
        """Valide la structure et la pertinence du quiz"""
        try:
            if not isinstance(quiz_data.get('questions'), list):
                raise ValueError("Format de questions invalide")

            if len(quiz_data['questions']) != 5:  # Changé de 3 à 5
                raise ValueError(f"5 questions requises (reçu: {len(quiz_data['questions'])})")

            source_lower = source_text.lower()
            for i, q in enumerate(quiz_data['questions'], 1):
                # Validation structurelle
                if not all(key in q for key in ['question', 'options', 'correct_answer', 'explanation']):
                    raise ValueError(f"Question {i} incomplète")

                if len(q['options']) != 4:
                    raise ValueError(f"Question {i} doit avoir 4 options")

                if q['correct_answer'] not in {0, 1, 2, 3}:
                    raise ValueError(f"Question {i}: réponse doit être entre 0 et 3")

                # Validation de pertinence plus flexible
                question_lower = q['question'].lower()
                explanation_lower = q['explanation'].lower()
                
                # Vérifie si au moins un mot-clé du texte apparaît dans la question ou l'explication
                keywords = set(word for word in source_lower.split() if len(word) > 4)
                question_words = set(word for word in question_lower.split() if len(word) > 3)
                explanation_words = set(word for word in explanation_lower.split() if len(word) > 3)
                
                if not (keywords & question_words) and not (keywords & explanation_words):
                    raise ValueError(f"Question {i} non reliée au texte source")

            return True

        except ValueError as e:
            logger.warning(f"Quiz invalide : {e}")
            return False

    def get_quota_status(self) -> Dict:
        """Retourne le statut du quota quotidien"""
        today = time.strftime("%Y-%m-%d")
        daily_key = f"gemini_daily_{today}"
        daily_count = cache.get(daily_key, 0)
        
        return {
            'used': daily_count,
            'remaining': 1500 - daily_count,
            'limit': 1500,
            'percentage': round((daily_count / 1500) * 100, 2)
        }