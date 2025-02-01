import os
from groq import Groq

# Set the API key
os.environ['GROQ_API_KEY'] = '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'

class FinSaathiAI:
    def __init__(self):
        """
        Initialize FinSaathi AI using LLaMA 90B for continuous user interaction.
        """
        # Retrieve API key from environment variable
        self.api_key = os.environ.get('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("Groq API key must be provided in the GROQ_API_KEY environment variable.")

        # Initialize Groq client with the API key
        self.client = Groq(api_key=self.api_key)
        print("Welcome to FinSaathi AI! Your personalized financial assistant.")
        print("I’m here to answer your finance questions and provide actionable insights.")
        print("Type 'quit' or 'exit' anytime to end the conversation.\n")

    def run_assistant(self):
        """
        Engage in a continuous request-response interaction with the user until they decide to exit.
        """
        # Start loop for continuous conversation
        while True:
            # Get input from the user
            user_input = input("You: ")

            # Check if the user wants to quit
            if user_input.lower() in ["quit", "exit"]:
                print("Thank you for using FinSaathi AI. Goodbye!")
                break

            # Generate response from LLaMA 90B model
            try:
                response = self.client.chat.completions.create(
                    model="llama-3.2-90b-text-preview",
                    messages=[{"role": "user", "content": user_input}],
                    temperature=0.7
                )

                # Extract and print the AI response
                ai_response = response.choices[0].message.content.strip()
                print(f"FinSaathi AI: {ai_response}\n")

            except Exception as e:
                print(f"Error processing request: {str(e)}")

# Running FinSaathi AI
if __name__ == "__main__":
    # Instantiate and run the AI assistant
    assistant = FinSaathiAI()
    assistant.run_assistant()
