import os
from typing import Dict, Any, List, Optional
from groq import Groq
from datetime import datetime
import json
from dotenv import load_dotenv

load_dotenv()

class PersonalFinanceAssistant:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Personal Finance Assistant for low-income individuals.

        Args:
            api_key (str, optional): Groq API key
        """
        self.api_key = api_key or os.environ.get('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("Groq API key must be provided or set as GROQ_API_KEY environment variable")

        self.client = Groq(api_key=self.api_key)

    def analyze_expenses(self, income: float, expenses: Dict[str, float]) -> Dict[str, Any]:
        """
        Analyze expenses and provide personalized budgeting advice.

        Args:
            income (float): Monthly income
            expenses (Dict[str, float]): Dictionary of monthly expenses
        """
        total_expenses = sum(expenses.values())
        expense_breakdown = "\n".join([f"{category}: ₹{amount}" for category, amount in expenses.items()])

        prompt = f"""
        As a financial advisor for low-income individuals in India, analyze this person's financial situation and provide practical advice.

        Monthly Income: ₹{income}
        Monthly Expenses:
        {expense_breakdown}
        Total Expenses: ₹{total_expenses}

        Consider:
        - Government assistance programs they might qualify for
        - Ways to reduce essential expenses
        - Opportunities for additional income
        - Emergency fund building strategies
        - Debt management if applicable
        - Free or low-cost resources in their community

        Return ONLY in this JSON format:
        {{
            "budget_analysis": {{
                "income_status": <living wage/below living wage>,
                "expense_ratio": <percentage of income>,
                "high_priority_concerns": [<list of immediate concerns>]
            }},
            "cost_saving_recommendations": [
                {{
                    "category": <expense category>,
                    "current_amount": <amount>,
                    "suggested_amount": <amount>,
                    "saving_strategies": [<specific actionable steps>]
                }}
            ],
            "assistance_programs": [
                {{
                    "program_name": <name>,
                    "eligibility": <basic criteria>,
                    "potential_benefit": <estimated value>,
                    "how_to_apply": <steps>
                }}
            ],
            "income_opportunities": [
                {{
                    "opportunity": <description>,
                    "potential_income": <estimated amount>,
                    "requirements": <what's needed>,
                    "next_steps": <how to start>
                }}
            ],
            "free_resources": [
                {{
                    "resource_type": <type of resource>,
                    "description": <what it offers>,
                    "how_to_access": <steps to access>
                }}
            ]
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="llama-3.2-90b-text-preview",
                messages=[{"role": "system", "content": prompt}],
                temperature=0.1
            )

            return json.loads(response.choices[0].message.content.strip())

        except Exception as e:
            print(f"Error in expense analysis: {str(e)}")
            return None

    def get_assistance_programs(self) -> List[Dict[str, Any]]:
        """
        Provide detailed information on assistance programs available in India.
        """
        return [
            {
                'program_name': 'Pradhan Mantri Awas Yojana (PMAY)',
                'description': 'A housing scheme aimed at providing affordable housing to the urban poor.',
                'eligibility': [
                    "Must be a resident of India.",
                    "Income limit for EWS and LIG categories.",
                    "First-time homebuyers."
                ],
                'benefits': [
                    "Subsidy on home loan interest rates.",
                    "Financial assistance for building or purchasing a house."
                ],
                'how_to_apply': [
                    "Visit the official PMAY website.",
                    "Register online by filling out the application form.",
                    "Submit required documents, including identity proof and income certificate."
                ],
                'contact_information': {
                    'website': 'https://pmaymis.gov.in/',
                    'helpline': '1800 11 3355',
                    'email': 'pmay-mis@gov.in'
                }
            },
            {
                'program_name': 'Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)',
                'description': 'Provides a legal guarantee for at least 100 days of unskilled wage employment in a financial year to every rural household.',
                'eligibility': [
                    "All rural households are eligible.",
                    "Must apply through the local gram panchayat."
                ],
                'benefits': [
                    "Wage payment for unskilled manual work.",
                    "Work can include construction of roads, canals, and other public works."
                ],
                'how_to_apply': [
                    "Visit your local gram panchayat office.",
                    "Fill out the application for a job card.",
                    "The gram panchayat will provide employment within 15 days."
                ],
                'contact_information': {
                    'website': 'https://nrega.nic.in/netnrega/home.aspx',
                    'helpline': '1800 11 15560',
                    'email': 'nrega@nic.in'
                }
            },
            {
                'program_name': 'Public Distribution System (PDS)',
                'description': 'Provides subsidized food grains and essential commodities to low-income families.',
                'eligibility': [
                    "Households categorized as below the poverty line (BPL).",
                    "Must have a ration card."
                ],
                'benefits': [
                    "Subsidized rates for food grains like rice and wheat.",
                    "Access to essential commodities like sugar and kerosene."
                ],
                'how_to_apply': [
                    "Visit the nearest ration shop or food supply office.",
                    "Fill out the application for a ration card.",
                    "Provide necessary documents such as proof of income and residence."
                ],
                'contact_information': {
                    'website': 'http://nfsa.gov.in/',
                    'helpline': '1967',
                    'email': 'food@nic.in'
                }
            }
        ]

    def create_savings_plan(self, monthly_income: float, target_amount: float, timeframe_months: int) -> Dict[str, Any]:
        """
        Create a realistic savings plan for a specific goal.

        Args:
            monthly_income (float): Monthly income
            target_amount (float): Savings goal amount
            timeframe_months (int): Desired timeframe to reach goal
        """
        prompt = f"""
        Create a practical savings plan for a low-income individual in India.

        Monthly Income: ₹{monthly_income}
        Savings Goal: ₹{target_amount}
        Timeframe: {timeframe_months} months

        Return ONLY in this JSON format:
        {{
            "monthly_target": <amount to save per month>,
            "feasibility_assessment": <realistic/challenging/unrealistic>,
            "alternative_timeframes": {{
                "conservative": <longer timeframe>,
                "aggressive": <shorter timeframe>
            }},
            "saving_strategies": [
                {{
                    "strategy": <description>,
                    "potential_monthly_saving": <amount>,
                    "difficulty_level": <easy/medium/hard>,
                    "implementation_steps": [<steps>]
                }}
            ],
            "milestones": [
                {{
                    "amount": <target amount>,
                    "timeframe": <when to reach>,
                    "celebration_idea": <low-cost way to celebrate>
                }}
            ]
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="llama-3.2-90b-text-preview",
                messages=[{"role": "system", "content": prompt}],
                temperature=0.1
            )

            return json.loads(response.choices[0].message.content.strip())

        except Exception as e:
            print(f"Error creating savings plan: {str(e)}")
            return None

    def generate_financial_report(self,
                                income: float,
                                expenses: Dict[str, float],
                                savings: float,
                                goals: List[str]) -> Dict[str, Any]:
        """
        Generate a comprehensive personal finance report with action items.

        Args:
            income (float): Monthly income
            expenses (Dict[str, float]): Monthly expenses by category
            savings (float): Current savings
            goals (List[str]): Financial goals
        """
        try:
            # Get expense analysis
            expense_analysis = self.analyze_expenses(income, expenses)

            # Create savings plans for goals
            savings_plans = []
            for goal in goals:
                if ":" in goal:
                    goal_desc, amount = goal.split(":")
                    amount = float(amount)
                    plan = self.create_savings_plan(income, amount, 12)
                    if plan:
                        savings_plans.append({"goal": goal_desc, "plan": plan})

            # Get assistance programs
            assistance_programs = self.get_assistance_programs()

            # Compile report
            report = {
                'analysis_date': datetime.now().strftime('%Y-%m-%d'),
                'financial_analysis': expense_analysis,
                'savings_plans': savings_plans,
                'assistance_programs': assistance_programs
            }
            return report

        except Exception as e:
            print(f"Error generating financial report: {str(e)}")
            return {}

# Example usage
if __name__ == "__main__":
    assistant = PersonalFinanceAssistant()

    # User inputs
    monthly_income = 25000  # Example income
    monthly_expenses = {
        "Rent": 8000,
        "Groceries": 4000,
        "Utilities": 2000,
        "Transport": 1500,
        "Healthcare": 1000,
        "Entertainment": 2500,
        "Education": 5000,
        "Others": 2000
    }

    # Savings and goals
    current_savings = 10000
    financial_goals = ["Emergency Fund: 30000", "New Laptop: 50000"]

    # Generate the financial report
    report = assistant.generate_financial_report(monthly_income, monthly_expenses, current_savings, financial_goals)

    # Output the report
    print(json.dumps(report, indent=4, ensure_ascii=False))
