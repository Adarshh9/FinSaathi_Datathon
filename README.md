# FinSaathi

**AI-powered financial insights for enterprises**

---

## Overview

FinSaathi AI empowers enterprises with **real-time financial intelligence**, automating investment analysis, risk assessment, and strategy formulation. Leveraging advanced AI models like LLaMA-90B and DeepSeek-R1, FinSaathi simplifies complex financial data, delivering actionable insights and enhancing enterprise decision-making through an intuitive interface.  
Demo video: [Watch here](https://www.youtube.com/watch?v=fVP2TJPEvbE) 

---

## Features

- **LLM-powered Financial Insights**: Generates detailed financial reports, technical analyses, investment insights, and risk assessments based on live market data.
- **Automated Risk Analysis**: Implements Monte Carlo simulations and confidence scoring for transparent, robust predictions.
- **Real-Time Data Retrieval**: Integrates with yfinance API and Elasticsearch for up-to-the-minute market data and efficient querying.
- **User-Friendly Dashboards**: Presents complex AI analysis in a digestible, interactive web dashboard.
- **Multi-Channel Delivery**: Exports analyses as PDF, delivers insights through dashboards, and sends metrics via chat interfaces.

---

## Challenges Solved

- **Handling Large-Scale Financial Data**: Optimized storage and retrieval using Elasticsearch for both structured and unstructured data.
- **Ensuring Model Accuracy**: Combined LLaMA-90B and DeepSeek-R1 predictions with Monte Carlo simulations to improve reliability and transparency.
- **Intuitive User Experience**: Developed interactive dashboards and automated narratives for clear communication of complex analyses.

---

## Technologies Used

- **Frontend**: React, Next.js
- **Backend**: Flask, Firebase
- **AI/ML Frameworks**: PyTorch, Transformers (Hugging Face)
- **Data Operations**: Elasticsearch, yfinance API
- **Analytics**: Monte Carlo Simulation, DeepSeek, LLaMA-90B

---

## Getting Started

1. **Clone the Repository**
```
git clone https://github.com/Adarshh9/FinSaathi.git
cd FinSaathi
```

2. **Install Dependencies**  
*(Assuming Node.js, Python, and pip are pre-installed)*
```
#Frontend
cd frontend
npm install

#Backend
cd ../backend
pip install -r requirements.txt
```

3. **Configure Environment**
- Edit `.env` files for both frontend and backend with API keys (Firebase, yfinance, Elasticsearch endpoints, etc.).

4. **Run Project**
- Start backend server:
  ```
  python app.py
  ```
- Start frontend dev server:
  ```
  npm run dev
  ```

---

## Demo

[Watch Demo Video](https://www.youtube.com/watch?v=fVP2TJPEvbE)

---

## Contributing

Contributions are welcome! Please submit issues or pull requests via GitHub.

---

## License

This project is licensed under the MIT License.

---

FinSaathi: **AI-powered financial intelligence for the future.**
