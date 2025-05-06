import google.generativeai as genai
import json
import re
import random
from typing import Dict, Optional
from django.conf import settings

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            'gemini-1.5-pro-latest',
            generation_config={
                'temperature': 0.7,  # Optimal pour des QCM précis
                'top_p': 0.9,
                'top_k': 40,
                'max_output_tokens': 4000
            }
        )

    def generate_quiz_from_text(self, text: str, difficulty: str = "medium") -> Optional[Dict]:
        """
        Génère un quiz avec EXACTEMENT 10 questions
        
        Args:
            text: Texte source pour la génération
            difficulty: Niveau de difficulté (easy/medium/hard)
            
        Returns:
            Un quiz structuré avec 10 questions ou None si erreur
        """
        prompt = f"""Tu es un expert en création de quiz pédagogiques. Crée un quiz en JSON avec EXACTEMENT 10 questions.

1. Structure REQUISE :
{{
  "title": "Titre du quiz",
  "description": "Description concise",
  "questions": [
    {{
      "question": "Question claire et précise",
      "options": ["Option1", "Option2", "Option3", "Option4"],
      "correct_answer": INDEX_ALEATOIRE_0_3,
      "explanation": "Explication pédagogique"
    }}
  ]
}}

2. Règles ABSOLUES :
- EXACTEMENT 10 QUESTIONS (pas moins, pas plus)
- Difficulté: {difficulty.lower()}
- 4 options par question
- Réponses correctes aléatoirement réparties (25% chacune en moyenne)
- Une seule réponse clairement correcte par question
- Questions basées sur le texte fourni
- Format JSON pur (pas de ```json)

3. Texte source :
{text[:20000]}
"""
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                response = self.model.generate_content(prompt)
                quiz_data = self._parse_response(response.text)
                
                # Validation stricte
                if len(quiz_data['questions']) == 10:
                    self._validate_quiz_structure(quiz_data)
                    self._ensure_answer_distribution(quiz_data)
                    return quiz_data
                else:
                    print(f"Tentative {attempt + 1}: Nombre incorrect de questions ({len(quiz_data['questions'])})")
                    
            except Exception as e:
                print(f"ERREUR (tentative {attempt + 1}): {str(e)}")
        
        print("Échec après 3 tentatives")
        return None

    def _parse_response(self, response_text: str) -> Dict:
        """Extrait et nettoie le JSON de la réponse"""
        # Nettoyage approfondi
        cleaned = re.sub(r'^```(json)?|```$', '', response_text.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r'//.*?$', '', cleaned, flags=re.MULTILINE)  # Supprime les commentaires
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Dernière tentative en extrayant le premier JSON valide
            match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise ValueError("Aucun JSON valide trouvé")

    def _validate_quiz_structure(self, quiz_data: Dict):
        """Valide la structure du quiz avec 10 questions"""
        if not isinstance(quiz_data.get('questions'), list):
            raise ValueError("Format de questions invalide")
            
        if len(quiz_data['questions']) != 10:
            raise ValueError(f"Le quiz doit contenir exactement 10 questions (reçu: {len(quiz_data['questions'])})")
            
        for i, q in enumerate(quiz_data['questions'], 1):
            if not all(key in q for key in ['question', 'options', 'correct_answer']):
                raise ValueError(f"Question {i} incomplète")
            if len(q['options']) != 4:
                raise ValueError(f"Question {i} doit avoir 4 options")
            if q['correct_answer'] not in {0, 1, 2, 3}:
                raise ValueError(f"Question {i}: index de réponse invalide")

    def _ensure_answer_distribution(self, quiz_data: Dict):
        """Garantit une distribution équilibrée des bonnes réponses"""
        positions = [q['correct_answer'] for q in quiz_data['questions']]
        position_counts = {i: positions.count(i) for i in range(4)}
        
        # Rééquilibrage si une position a plus de 3 bonnes réponses
        if max(position_counts.values()) > 3:
            print("Rééquilibrage des réponses correctes...")
            for q in quiz_data['questions']:
                options = q['options']
                correct_text = options[q['correct_answer']]
                random.shuffle(options)
                q['correct_answer'] = options.index(correct_text)