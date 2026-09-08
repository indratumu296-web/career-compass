# 🎯 Career Compass — SmartHire

### Resume-to-Job Matching & Career Guidance Engine

**Career Compass (SmartHire)** is a classical Machine Learning–based career guidance platform that analyzes a user's resume, predicts their most suitable career category, recommends relevant job opportunities, and identifies the skills they need to improve.

> **No LLMs are used.** The project focuses on traditional Machine Learning and Natural Language Processing techniques such as **TF-IDF, Logistic Regression, Cosine Similarity, and K-Means clustering**.

---

## 🌟 Project Overview

Finding the right job can be difficult when a resume does not clearly match the requirements of available positions.

**Career Compass** addresses this problem through an end-to-end ML pipeline:

```text
Resume Upload
      ↓
Resume Text Extraction
      ↓
Text Preprocessing
      ↓
Resume Category Prediction
      ↓
Job Recommendation
      ↓
Skill-Gap Analysis
      ↓
Career Guidance
```

The system converts unstructured resume and job-description text into useful career insights.

---

## 🚀 Key Features

### 📄 1. Resume Analysis

Upload a resume in supported formats and extract its textual information for analysis.

**Supported formats:**

* PDF
* DOCX
* TXT

The extracted content is cleaned and transformed into machine-readable text.

---

### 🤖 2. Resume Category Classification

The system predicts the most relevant career or job category from the uploaded resume.

**Machine Learning approach:**

```text
Resume Text
     ↓
Text Cleaning
     ↓
TF-IDF Vectorization
     ↓
Logistic Regression
     ↓
Predicted Career Category
```

**Algorithm:** Logistic Regression
**Feature Extraction:** TF-IDF

---

### 💼 3. Job Recommendation System

Career Compass recommends the most relevant jobs by comparing the user's resume with available job descriptions.

The system uses:

* TF-IDF Vectorization
* Cosine Similarity
* Top-N ranking

Example:

```text
Resume
   ↓
TF-IDF Vector
   ↓
Compare with Job Vectors
   ↓
Cosine Similarity
   ↓
Rank Jobs
   ↓
Top-N Recommendations
```

---

### 🧩 4. Skill-Gap Analysis

The platform identifies missing skills by comparing:

```text
Required Job Skills
        −
Resume Skills
        =
Skill Gap
```

For example:

**Job Requirements**

```text
Python
SQL
Machine Learning
Power BI
Git
```

**Resume Skills**

```text
Python
SQL
Git
```

**Identified Skill Gap**

```text
Machine Learning
Power BI
```

This helps users understand what they should learn to become stronger candidates.

---

### 📊 5. Career Insights

The platform can provide useful information such as:

* Predicted career category
* Job-match percentage
* Recommended job roles
* Matching skills
* Missing skills
* Career improvement areas

---

## 🧠 Machine Learning Approach

Career Compass primarily uses classical ML techniques.

| Component                      | Technique           | Purpose                                 |
| ------------------------------ | ------------------- | --------------------------------------- |
| Resume Classification          | Logistic Regression | Predict resume/job category             |
| Text Features                  | TF-IDF              | Convert text into numerical vectors     |
| Job Recommendation             | Cosine Similarity   | Rank relevant jobs                      |
| Clustering                     | K-Means             | Discover groups of similar jobs/resumes |
| Skill Analysis                 | Skill Overlap       | Identify missing skills                 |
| Fit Prediction *(Optional)*    | Supervised ML       | Estimate candidate-job fit              |
| Salary Prediction *(Optional)* | Regression          | Estimate salary ranges                  |
| Topic Modeling *(Optional)*    | NLP                 | Discover common job topics              |

---

# 🏗️ System Architecture

```text
                    ┌──────────────────┐
                    │   Resume Upload  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │  Resume Parser   │
                    │ PDF/DOCX/TXT     │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Text Preprocessing│
                    └────────┬─────────┘
                             ↓
              ┌──────────────┴──────────────┐
              ↓                             ↓
   ┌────────────────────┐        ┌────────────────────┐
   │ Resume Classifier  │        │ Job Recommender    │
   │ TF-IDF + Logistic  │        │ TF-IDF + Cosine     │
   │ Regression         │        │ Similarity          │
   └─────────┬──────────┘        └─────────┬──────────┘
             ↓                             ↓
   ┌────────────────────┐        ┌────────────────────┐
   │ Career Category    │        │ Top-N Job Matches  │
   └─────────┬──────────┘        └─────────┬──────────┘
             └──────────────┬──────────────┘
                            ↓
                   ┌───────────────────┐
                   │ Skill-Gap Analysis│
                   └─────────┬─────────┘
                             ↓
                   ┌───────────────────┐
                   │ Career Guidance   │
                   └───────────────────┘
```

---

# 📁 Project Structure

```text
SmartHire/
│
├── README.md
├── requirements.txt
├── .gitignore
├── download_data.py
│
├── data/
│   ├── raw/
│   │   ├── resume_data.csv
│   │   ├── naukri_data.csv
│   │   └── linkedin_data.csv
│   │
│   ├── interim/
│   │   └── job_corpus.csv
│   │
│   └── processed/
│       ├── jobs_clean.csv
│       └── resumes_clean.csv
│
├── notebooks/
│   ├── 01_eda.ipynb
│   ├── 02_resume_classifier.ipynb
│   ├── 03_recommender.ipynb
│   ├── 04_clustering_topics.ipynb
│   └── 05_fit_predictor.ipynb
│
├── src/
│   ├── config.py
│   │
│   ├── data/
│   │   ├── load_data.py
│   │   └── preprocess.py
│   │
│   ├── features/
│   │   ├── text_features.py
│   │   └── match_features.py
│   │
│   ├── models/
│   │   ├── classifier.py
│   │   ├── recommender.py
│   │   ├── clustering.py
│   │   └── fit_predictor.py
│   │
│   ├── parsing/
│   │   └── resume_parser.py
│   │
│   └── evaluate.py
│
├── models/
│   ├── classifier.pkl
│   ├── tfidf_vectorizer.pkl
│   └── recommender.pkl
│
├── app/
│   └── streamlit_app.py
│
├── reports/
│   └── figures/
│
└── tests/
    └── test_features.py
```

---

# ⚙️ Technology Stack

### Programming Language

* Python 3.10+
* Developed and tested with Python 3.12

### Machine Learning

* Scikit-learn
* Logistic Regression
* K-Means
* Cosine Similarity

### Natural Language Processing

* TF-IDF
* Text preprocessing
* Regular expressions
* Keyword/skill extraction

### Data Processing

* Pandas
* NumPy

### Data Visualization

* Matplotlib
* Plotly

### Web Application

* Streamlit

### Development Tools

* Git
* GitHub
* VS Code
* Jupyter Notebook

---

# 📦 Requirements

Before starting the project, make sure you have:

* **Python 3.10 or higher**
* **Git**
* **Kaggle account**
* **VS Code** *(recommended)*
* Internet connection for downloading datasets

---

# 🛠️ Installation & Setup

## 1. Clone the Repository

Clone the project from GitHub:

```bash
git clone <https://github.com/indratumu296-web/career-compass.git>
cd SmartHire
```


## 2. Create a Virtual Environment

### Windows

```bash
python -m venv .venv
```

Activate it using PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Or Command Prompt:

```cmd
.venv\Scripts\activate.bat
```

### macOS / Linux

```bash
source .venv/bin/activate
```

---

## 3. Install Dependencies

Install all required Python packages:

```bash
pip install -r requirements.txt
```

---

# 📊 Dataset Setup

The datasets are **not included in the GitHub repository** because they are stored in the project's `.gitignore`.

Download the required datasets using:

```bash
python download_data.py
```

The first execution may ask for your Kaggle credentials.

### Kaggle API Setup

1. Log in to Kaggle.
2. Open **Settings**.
3. Find the **API** section.
4. Create a new API token.
5. Configure your Kaggle credentials.
6. Run:

```bash
python download_data.py
```

The script downloads the required Resume and Naukri datasets.

LinkedIn data can be included as an optional dataset.

---

# 🧹 Data Preprocessing

After downloading the datasets, run:

```bash
python -m src.data.preprocess
```

This process:

* Loads raw datasets
* Handles missing values
* Cleans text
* Removes unnecessary characters
* Normalizes textual information
* Combines job datasets
* Creates model-ready datasets

Generated files include:

```text
data/interim/job_corpus.csv

data/processed/jobs_clean.csv

data/processed/resumes_clean.csv
```

> Run commands from the project root so that the `src` package imports work correctly.

---

# 📓 Running the Notebooks

The project uses notebooks for exploration, experimentation, model development, and evaluation.

Open the project in **VS Code** and install:

* Python extension
* Jupyter extension

Then open:

```text
notebooks/01_eda.ipynb
```

Select:

```text
Select Kernel
      ↓
Python Environments
      ↓
.venv
```

For Python 3.12, the environment may appear as:

```text
.venv (Python 3.12)
```

Run notebook cells using:

```text
Shift + Enter
```

---

# 🔢 Recommended Execution Order

Run the notebooks in this order:

```text
01 → 02 → 03 → 04 → 05
```

### Notebook 01 — Exploratory Data Analysis

```text
01_eda.ipynb
```

Analyze:

* Dataset size
* Columns
* Missing values
* Job categories
* Resume categories
* Text statistics
* Data distributions

---

### Notebook 02 — Resume Classifier

```text
02_resume_classifier.ipynb
```

Build:

```text
TF-IDF
   ↓
Logistic Regression
   ↓
Resume Category
```

Evaluate the classifier using appropriate classification metrics.

---

### Notebook 03 — Job Recommender

```text
03_recommender.ipynb
```

Build:

```text
Resume
   ↓
TF-IDF
   ↓
Cosine Similarity
   ↓
Job Ranking
   ↓
Top-N Jobs
```

---

### Notebook 04 — Clustering & Topics

```text
04_clustering_topics.ipynb
```

Explore:

* K-Means clustering
* Similar job groups
* Career clusters
* Topic discovery
* Skill patterns

This notebook also supports the skill-gap analysis.

---

### Notebook 05 — Fit Predictor

```text
05_fit_predictor.ipynb
```

This is an **optional supervised learning module** that can estimate how well a candidate matches a particular job.

---

# 💾 Saving Trained Models

After training, save reusable models into:

```text
models/
```

For example:

```text
models/
├── classifier.pkl
├── tfidf_vectorizer.pkl
└── recommender.pkl
```

Models should be saved using `joblib` so that the Streamlit application can load them without retraining.

---

# 🌐 Launch the Streamlit Application

Once the models and application are ready, run:

```bash
streamlit run app/streamlit_app.py
```

The application will normally open at:

```text
http://localhost:8501
```

The portal will provide the main Career Compass workflow:

```text
Upload Resume
      ↓
Analyze Resume
      ↓
Predict Career Category
      ↓
Find Matching Jobs
      ↓
Analyze Skills
      ↓
View Career Guidance
```

---

# 📈 Model Evaluation

The project can evaluate its models using appropriate metrics.

### Classification

* Accuracy
* Precision
* Recall
* F1-score
* Confusion Matrix

### Recommendation

* Cosine similarity
* Top-N relevance
* Ranking quality

### Clustering

* Silhouette Score
* Cluster distribution
* PCA / t-SNE visualization

### Optional Fit Predictor

* Accuracy
* Precision
* Recall
* F1-score
* ROC-AUC

---

# 🔮 Future Enhancements

The project can be extended with additional Machine Learning capabilities.

### 💡 Possible improvements

* Job fit prediction
* Salary prediction
* Advanced skill extraction
* Career path recommendations
* K-Means career clustering
* Topic modeling
* Experience matching
* Education matching
* Location-based job recommendations
* Interactive analytics dashboard
* Personalized learning recommendations
* Model performance dashboard

---

# 🔐 Data & Privacy

Career Compass is designed with data handling in mind.

* Raw datasets are excluded from Git.
* Personal resume files should not be committed to the repository.
* Trained models can be stored separately.
* Sensitive user information should be handled responsibly.
* `.gitignore` should be configured to prevent accidental dataset and credential uploads.

**Never commit Kaggle API credentials, personal resumes, passwords, or private data to GitHub.**

---

# 🧪 Testing

Basic feature tests are located in:

```text
tests/
```

Run tests using:

```bash
# 💻 Local Development

If you prefer developing locally, make sure **Node.js and npm** are installed.

You can install Node.js using **nvm**.

Then clone the repository:

```bash
git clone <THIS_REPOSITORY_URL>
cd <REPOSITORY_NAME>
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# 🗺️ Development Roadmap

```text
✅ Project structure
       ↓
✅ Dataset download
       ↓
✅ Data preprocessing
       ↓
🔄 Exploratory Data Analysis
       ↓
🔄 Resume classification
       ↓
🔄 Job recommendation
       ↓
🔄 Skill-gap analysis
       ↓
🔄 Model evaluation
       ↓
🔄 Streamlit application
       ↓
🔄 Testing
       ↓
🚀 Final deployment
```

---

# 🎯 Project Goal

The main goal of **Career Compass — SmartHire** is to build an intelligent, explainable, and practical career guidance system using classical Machine Learning.

Instead of simply showing job listings, the platform helps users understand:

> **“Which career path fits my resume, which jobs match my profile, and what skills should I learn next?”**

---

# 👨‍💻 Project

**Career Compass — SmartHire**

**Resume-to-Job Matching & Career Guidance Engine**

Built using:

```text
Python
Pandas
Scikit-learn
TF-IDF
Logistic Regression
Cosine Similarity
K-Means
Streamlit
Git & GitHub
```

---

## ⭐ If You Like This Project

If you find this project useful, consider giving the repository a ⭐ on GitHub and sharing your feedback.

---

## 📄 License

This project is intended for educational, academic, and portfolio purposes.

Add an appropriate open-source license such as **MIT License** if you want others to legally reuse and modify the code.
