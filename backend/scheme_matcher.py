import re
import json
from typing import List, Dict, Optional, Tuple
import numpy as np
from pathlib import Path
import pandas as pd
import pypdf
from functools import lru_cache
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import warnings
from dataclasses import dataclass
from collections import defaultdict
warnings.filterwarnings('ignore')

@dataclass
class Scheme:
    """Data class for storing scheme information"""
    code: str
    name: str
    ministry: str
    objective: str
    beneficiary: str
    features: str
    embedding: Optional[np.ndarray] = None

class ImprovedSchemeMatcher:
    def __init__(self, cache_dir: Optional[str] = None):
        self.encoder = SentenceTransformer('paraphrase-MiniLM-L3-v2')
        self.schemes: List[Scheme] = []
        self.cache_dir = Path(cache_dir) if cache_dir else None
        
        self.keyword_mappings = {
            'gender': {
                'female': ['women', 'woman', 'girl', 'daughter', 'widow', 'mother', 'female', 'mahila', 'ladies'],
                'male': ['men', 'man', 'boy', 'son', 'father', 'male', 'gents'],
                'transgender': ['transgender', 'third gender', 'kinnar', 'other gender']
            },
            'age': {
                'child': ['below 18', 'child', 'children', 'minor', 'young', 'below 14', 'below 16', 'kids'],
                'youth': ['18-35', 'youth', 'young adult', 'student', 'college', 'adolescent'],
                'adult': ['36-60', 'adult', 'middle aged', 'working', 'middle-age'],
                'senior': ['above 60', 'senior citizen', 'elderly', 'old age', 'pension', 'retired']
            },
            'occupation': {
                'farmer': ['farmer', 'agriculture', 'farming', 'cultivation', 'crop', 'kisan', 'agricultural'],
                'student': ['student', 'studying', 'education', 'college', 'school', 'university', 'learner'],
                'worker': ['worker', 'labour', 'employee', 'working', 'job', 'employment', 'wage'],
                'business': ['business', 'entrepreneur', 'self employed', 'startup', 'enterprise', 'vendor'],
                'unemployed': ['unemployed', 'jobless', 'seeking work', 'job seeker', 'without employment']
            },
            'category': {
                'general': ['general category', 'general', 'unreserved', 'open category'],
                'sc': ['scheduled caste', 'sc', 'dalit', 'scheduled-caste'],
                'st': ['scheduled tribe', 'st', 'tribal', 'scheduled-tribe'],
                'obc': ['other backward class', 'obc', 'backward', 'other-backward'],
                'minority': ['minority', 'religious minority', 'muslim', 'christian', 'sikh', 'buddhist']
            },
            'location': {
                'rural': ['rural', 'village', 'gram', 'panchayat', 'tribal area'],
                'urban': ['urban', 'city', 'town', 'metropolitan', 'municipal'],
                'semi_urban': ['semi urban', 'suburb', 'small town']
            }
        }

    def _clean_text(self, text: str) -> str:
        """Enhanced text cleaning with special handling for government scheme text."""
        if not text:
            return ""
        text = re.sub(r'\s+', ' ', text.strip())
        text = re.sub(r'[^\w\s.,;()-]', '', text)
        text = re.sub(r'(?i)rs\.?\s*', 'rs ', text)
        text = re.sub(r'(\d+)\s*-\s*(\d+)', r'\1-\2', text)
        return text.strip()

    def extract_scheme_details(self, text: str) -> Dict:
        """Enhanced scheme details extraction with improved section parsing."""
        if not text:
            return None

        scheme_header_pattern = r'([A-Z]\.\d+\.)\s*([^\n]+)'
        scheme_header_match = re.match(scheme_header_pattern, text)

        if not scheme_header_match:
            return None

        scheme_code = scheme_header_match.group(1).strip()
        scheme_name = scheme_header_match.group(2).strip()

        # Skip table of contents entries
        if re.search(r'\d+$', scheme_name) and len(text.split('\n')) < 3:
            return None

        sections = {
            'objective': ['objective', 'aim', 'purpose', 'goals'],
            'beneficiary': ['intended beneficiary', 'beneficiaries', 'eligible', 'eligibility', 'target group'],
            'features': ['salient features', 'key features', 'benefits', 'assistance provided']
        }

        extracted_sections = {
            'objective': '',
            'beneficiary': '',
            'features': ''
        }

        # Extract sections using multiple possible headers
        current_section = None
        lines = text.split('\n')
        
        for i, line in enumerate(lines):
            line = line.strip().lower()
            
            # Check for section headers
            for section, headers in sections.items():
                if any(header.lower() in line for header in headers):
                    current_section = section
                    continue
            
            # If we're in a section, add content
            if current_section and line and not any(header.lower() in line for headers in sections.values() for header in headers):
                extracted_sections[current_section] += line + ' '

        # Clean up extracted sections
        for section in extracted_sections:
            extracted_sections[section] = self._clean_text(extracted_sections[section])

        return {
            'code': scheme_code,
            'name': scheme_name,
            'objective': extracted_sections['objective'],
            'beneficiary': extracted_sections['beneficiary'],
            'features': extracted_sections['features']
        }

    def load_schemes(self, pdf_path: str) -> None:
        """Load schemes from PDF with enhanced parsing."""
        try:
            reader = pypdf.PdfReader(pdf_path)
            current_ministry = ""
            current_scheme_text = ""
            parsing_scheme = False

            for page in reader.pages:
                page_text = page.extract_text()
                lines = page_text.split('\n')

                for line in lines:
                    # Check for ministry header
                    ministry_match = re.match(r'([A-Z]\.)\s+MINISTRY.*', line)
                    if ministry_match:
                        current_ministry = line.strip()
                        continue

                    # Check for scheme header
                    scheme_match = re.match(r'[A-Z]\.\d+\.', line)
                    if scheme_match:
                        # Save previous scheme if exists
                        if parsing_scheme and current_scheme_text:
                            scheme_details = self.extract_scheme_details(current_scheme_text)
                            if scheme_details:
                                scheme = Scheme(
                                    code=scheme_details['code'],
                                    name=scheme_details['name'],
                                    ministry=current_ministry,
                                    objective=scheme_details['objective'],
                                    beneficiary=scheme_details['beneficiary'],
                                    features=scheme_details['features'],
                                    embedding=None
                                )
                                combined_text = f"{scheme.beneficiary} {scheme.features} {scheme.objective}"
                                scheme.embedding = self._get_embedding(combined_text)
                                self.schemes.append(scheme)

                        # Start new scheme
                        current_scheme_text = line
                        parsing_scheme = True
                    elif parsing_scheme:
                        current_scheme_text += "\n" + line

            # Process last scheme
            if parsing_scheme and current_scheme_text:
                scheme_details = self.extract_scheme_details(current_scheme_text)
                if scheme_details:
                    scheme = Scheme(
                        code=scheme_details['code'],
                        name=scheme_details['name'],
                        ministry=current_ministry,
                        objective=scheme_details['objective'],
                        beneficiary=scheme_details['beneficiary'],
                        features=scheme_details['features'],
                        embedding=None
                    )
                    combined_text = f"{scheme.beneficiary} {scheme.features} {scheme.objective}"
                    scheme.embedding = self._get_embedding(combined_text)
                    self.schemes.append(scheme)

            print(f"Successfully loaded {len(self.schemes)} schemes")

        except Exception as e:
            print(f"Error loading schemes: {str(e)}")
            raise

    @lru_cache(maxsize=1024)
    def _get_embedding(self, text: str) -> np.ndarray:
        """Generate and cache embeddings."""
        if not text:
            return np.zeros(384)  # Default embedding size for the model
        return self.encoder.encode(text)

    def _calculate_keyword_score(self, profile: Dict, scheme: Scheme) -> Tuple[float, List[str]]:
        """Calculate keyword-based matching score with detailed reasoning."""
        score = 0.0
        reasons = []
        total_weight = 0.0

        scheme_text = f"{scheme.beneficiary} {scheme.features} {scheme.objective}".lower()

        weights = {
            'gender': 0.3,
            'age': 0.25,
            'occupation': 0.25,
            'category': 0.2,
            'location': 0.2
        }

        def check_keywords(category: str, value: str, weight: float) -> float:
            if not value or category not in self.keyword_mappings:
                return 0

            keywords = self.keyword_mappings[category].get(value.lower(), [])
            matched_keywords = [k for k in keywords if k in scheme_text]

            if matched_keywords:
                keyword_str = ', '.join(matched_keywords)
                reasons.append(f"Matches {value} {category} (keywords: {keyword_str})")
                return weight
            return 0

        for criterion, weight in weights.items():
            if criterion in profile:
                score += check_keywords(criterion, profile[criterion], weight)
                total_weight += weight

        if total_weight > 0:
            score = score / total_weight

        return score, reasons

    def _calculate_semantic_score(self, profile: Dict, scheme: Scheme) -> float:
        """Calculate semantic similarity score."""
        profile_text = (
            f"{profile.get('gender', '')} {profile.get('age', '')} years old "
            f"{profile.get('occupation', '')} {profile.get('category', '')} person "
            f"from {profile.get('location', '')} area"
        )
        profile_embedding = self._get_embedding(profile_text)

        return float(cosine_similarity([profile_embedding], [scheme.embedding])[0][0])

    def find_matching_schemes(self, profile: Dict, top_k: int = 5) -> List[Dict]:
        """Find matching schemes using hybrid approach with improved scoring."""
        matches = []
        for scheme in self.schemes:
            keyword_score, reasons = self._calculate_keyword_score(profile, scheme)
            semantic_score = self._calculate_semantic_score(profile, scheme)

            final_score = (keyword_score * 0.6) + (semantic_score * 0.4)

            if final_score > 0.2:
                matches.append({
                    'scheme_code': scheme.code,
                    'scheme_name': scheme.name,
                    'ministry': scheme.ministry,
                    'objective': scheme.objective,
                    'beneficiary': scheme.beneficiary,
                    'features': scheme.features,
                    'match_score': round(final_score * 100, 2),
                    'keyword_score': round(keyword_score * 100, 2),
                    'semantic_score': round(semantic_score * 100, 2),
                    'relevance_reasons': reasons
                })

        return sorted(matches, key=lambda x: x['match_score'], reverse=True)[:top_k]

def main():
    matcher = ImprovedSchemeMatcher()
    
    # Load schemes
    pdf_path = "./Government_Schemes-English.pdf"  # Update with your PDF path
    matcher.load_schemes(pdf_path)

    # Example profile
    profile = {
        "gender": "female",
        "age": "16",
        "occupation": "street vendor",
        "income": "100000",
        "category": "sc",
        "location": "urban"
    }

    # Find matching schemes
    matches = matcher.find_matching_schemes(profile, top_k=5)

    # Display results
    print(f"\nTop matching schemes for profile: {profile}")
    print("-" * 80)

    for i, match in enumerate(matches, 1):
        print(f"\n{i}. {match['scheme_code']} {match['scheme_name']}")
        print(f"Ministry: {match['ministry']}")
        print(f"Match Score: {match['match_score']}%")
        print(f"- Keyword Score: {match['keyword_score']}%")
        print(f"- Semantic Score: {match['semantic_score']}%")
        print("\nRelevance Reasons:")
        for reason in match['relevance_reasons']:
            print(f"- {reason}")
        print("\nObjective:", match['objective'])
        print("Intended Beneficiary:", match['beneficiary'])
        print("Features:", match['features'])
        print("-" * 80)

if __name__ == "__main__":
    main()