# Veritas Lens

Build a Production-Grade Real-Time AI Fake News Detection & Verification Platform

You are a senior full-stack AI/ML engineer, NLP engineer, backend architect, database engineer, and UI/UX engineer.

Build a complete production-grade full-stack application called:

VeritasAI — Real-Time AI-Powered Fake News Detection & Verification Platform

The application must not be a simple demo or static fake-news classifier. It must combine machine-learning classification with real-time web/news evidence retrieval, fact-check databases, semantic similarity, source credibility analysis, explainable AI, persistent storage, caching, and a professional analyst dashboard.

1. Core Objective

Build a system where a user can:

Paste a news article.

Paste a URL.

Enter a headline or claim.

Upload a text/article file.

Search recent news.

Submit the content for verification.

Receive an AI-generated credibility assessment.

See supporting and contradicting evidence from external sources.

See existing fact-check results when available.

See source credibility information.

See explainable AI factors behind the prediction.

Save the analysis to history.

Compare multiple articles reporting the same event.

View analytics about previous analyses.

The system must clearly distinguish between:

ML prediction

Fact-check evidence

Web/news corroboration

Source credibility

Overall verification confidence

Never present an ML probability as absolute proof that an article is true or false.

2. Technology Stack

Frontend

Use:

React

Vite

JavaScript or TypeScript

Tailwind CSS

React Router

Axios

Recharts

Lucide React icons

Build a responsive desktop/tablet/mobile interface.

Backend

Use:

Python 3.11+

Flask

Flask-CORS

Flask-SQLAlchemy

Flask-Migrate

Marshmallow or Pydantic validation

Gunicorn

pytest

structured logging

Do NOT use Flask's development server for production.

Machine Learning / NLP

Use:

scikit-learn

NumPy

Pandas

NLTK or spaCy

Sentence Transformers

optional Hugging Face Transformers

SHAP where appropriate

Primary hybrid pipeline:

Raw Article
     ↓
Text Cleaning
     ↓
Language Detection
     ↓
Claim Extraction
     ↓
TF-IDF Features
     +
Transformer/Sentence Embeddings
     +
Linguistic Features
     +
Metadata Features
     ↓
ML Classifier
     ↓
Prediction


Use a modular architecture so the classifier can later be replaced by a fine-tuned transformer.

3. Important ML Requirement

Do NOT blindly claim:

"85% accuracy"

unless the actual evaluation produces that result.

Create an ML evaluation pipeline that calculates:

Accuracy

Precision

Recall

F1-score

ROC-AUC where applicable

Confusion matrix

Class distribution

Validation performance

Test performance

Inference latency

Display the actual measured metrics in the admin/model-performance dashboard.

Prevent data leakage by separating train/validation/test data correctly.

Prefer stratified splitting for classification.

4. Training Dataset

Create a configurable dataset layer supporting datasets such as:

LIAR

FakeNewsNet

other appropriately licensed fake-news datasets

The LIAR dataset contains approximately 12.8K manually labeled statements collected from PolitiFact, making it a useful benchmark for fake-news research.

Do not scrape copyrighted/private datasets without permission.

Create:

ml/
├── datasets/
├── preprocessing/
├── features/
├── models/
├── evaluation/
├── inference/
└── artifacts/


Create scripts:

python ml/train.py
python ml/evaluate.py
python ml/export_model.py


Store model artifacts separately from application source code.

5. Hybrid NLP Model

Implement a baseline and hybrid model.

Baseline

TF-IDF:

unigrams

bigrams

configurable max_features

stop-word handling

lowercase normalization

sparse representation

Use Logistic Regression or Linear SVM as the baseline.

Hybrid

Combine:

TF-IDF
+
Sentence Transformer embedding
+
linguistic features
+
article metadata


Possible linguistic features:

article length

sentence count

average sentence length

punctuation frequency

uppercase ratio

exclamation ratio

question ratio

URL count

sensational-word indicators

quotation frequency

named entity count

Use a configurable classifier.

Keep feature extraction deterministic and reusable during inference.

6. Real-Time Web Intelligence

This is a critical requirement.

The application must not rely only on its trained dataset.

Implement an external evidence layer.

Create:

backend/
└── services/
    ├── news_search_service.py
    ├── factcheck_service.py
    ├── evidence_service.py
    ├── source_credibility_service.py
    └── search_orchestrator.py


News search

Integrate a configurable news search provider such as NewsAPI.

Use environment variables:

NEWS_API_KEY=


Never expose API keys in React.

Search using:

extracted claims

article headline

named entities

important keywords

Retrieve:

title

description

URL

publisher

publication date

author where available

source/domain

Do not automatically assume that a large number of matching articles means a claim is true.

7. Fact-Check Integration

Integrate Google's Fact Check Tools API where available.

Environment:

GOOGLE_FACTCHECK_API_KEY=


Search extracted claims against fact-checked claims.

Return:

matched claim

review publisher

rating

review URL

claim date

matching confidence

Create a clear UI section:

Existing Fact Checks

Example:

Claim:
"Example claim..."

Fact-check result:
FALSE

Reviewed by:
Example Fact Checker

Evidence:
[View source]


If no fact-check exists, explicitly display:

"No matching fact-check found."

Do not interpret "no fact-check found" as "true."

8. Evidence Retrieval

For every important claim:

Extract the claim.

Search current/recent news.

Search fact-check databases.

Retrieve candidate evidence.

Normalize results.

Deduplicate sources.

Calculate semantic similarity.

Classify evidence as:

supporting

contradicting

neutral

insufficient

Rank evidence.

Return the strongest evidence.

Use Sentence Transformer embeddings for semantic matching.

Implement:

claim → embedding
evidence article → embedding
similarity(claim, evidence)


Do not make a final truth decision from semantic similarity alone.

9. Evidence Fusion Engine

Create:

backend/services/verification_engine.py


It should combine multiple signals.

Example conceptual scoring:

ML classification score
+
fact-check match
+
supporting evidence
+
contradicting evidence
+
source credibility
+
semantic similarity
+
article metadata


Use configurable weights.

Do NOT hard-code arbitrary weights without documenting them.

Return:

{
  "verdict": "LIKELY_FALSE",
  "confidence": 0.87,
  "ml_prediction": {
    "label": "FALSE",
    "probability": 0.81
  },
  "evidence_score": 0.91,
  "source_score": 0.74,
  "factcheck_match": true,
  "explanation": []
}


The final system should support:

VERIFIED
LIKELY_TRUE
MIXED
LIKELY_FALSE
UNVERIFIED
INSUFFICIENT_EVIDENCE


Avoid binary-only TRUE/FALSE decisions when evidence is insufficient.

10. Source Credibility Engine

Create a source profile system.

Store:

domain
publisher
country
category
historical reputation
fact-check history
article count
source metadata
last updated


Do NOT create a simplistic blacklist of "fake websites."

Instead return:

Source credibility:
72/100

Factors:
- Established publisher
- Multiple corroborating reports
- Transparent author information
- Historical verification data


Make the scoring explainable.

11. Database

Use PostgreSQL in production.

Use SQLite only for simple local development if necessary.

Database entities:

users

id
name
email
password_hash
role
created_at
updated_at


articles

id
url
title
content
author
publisher
published_at
language
domain
created_at


claims

id
article_id
claim_text
claim_type
importance
embedding
created_at


analyses

id
article_id
verdict
confidence
ml_label
ml_probability
evidence_score
source_score
processing_time_ms
model_version
created_at


evidence

id
analysis_id
claim_id
title
url
publisher
snippet
evidence_type
similarity_score
credibility_score
published_at
created_at


fact_checks

id
claim_id
publisher
rating
review_url
matched_claim
match_score
created_at


model_metrics

id
model_version
accuracy
precision
recall
f1
roc_auc
created_at


audit_logs

id
user_id
action
resource
resource_id
metadata
created_at


12. Vector Search

If PostgreSQL is available, use pgvector or another appropriate vector database.

Store embeddings for:

article content

extracted claims

evidence documents

Implement semantic retrieval:

query claim
      ↓
embedding
      ↓
vector search
      ↓
top-k evidence
      ↓
reranking


Keep vector storage abstract so another vector database can be added later.

13. Redis

Use Redis for:

repeated news searches

fact-check searches

expensive NLP predictions

rate limiting

temporary processing state

Example:

claim_hash → cached evidence
article_hash → cached prediction


Set sensible TTL values.

Never cache sensitive user data indefinitely.

14. REST API

Create versioned endpoints:

/api/v1/health
/api/v1/analyze
/api/v1/analyze/url
/api/v1/analyze/text
/api/v1/search/news
/api/v1/fact-check/search
/api/v1/evidence/search
/api/v1/articles
/api/v1/analyses
/api/v1/analyses/:id
/api/v1/history
/api/v1/analytics
/api/v1/model/metrics
/api/v1/sources/:domain


Main endpoint:

POST /api/v1/analyze


Request:

{
  "title": "Example headline",
  "content": "Example article text...",
  "url": "https://example.com/article"
}


Response:

{
  "analysis_id": "uuid",
  "verdict": "MIXED",
  "confidence": 0.78,
  "ml_prediction": {},
  "claims": [],
  "evidence": [],
  "fact_checks": [],
  "source_analysis": {},
  "explanations": [],
  "processing_time_ms": 184
}


15. API Security

Implement:

input validation

request size limits

rate limiting

CORS configuration

secure headers

API authentication

password hashing

JWT access tokens if authentication is implemented

environment-based secrets

structured error responses

Never store API keys inside frontend code.

Never commit:

.env
API keys
database passwords
JWT secrets
model credentials


Add them to .gitignore.

16. URL Analysis

Allow users to enter:

https://example.com/news/article


Backend should:

Validate URL.

Fetch article safely.

Extract title/content/author/date.

Sanitize HTML.

Remove scripts and irrelevant content.

Detect extraction failure.

Analyze extracted content.

Search related evidence.

Return verification result.

Protect against:

SSRF

private IP addresses

localhost URLs

dangerous redirects

huge responses

unsupported protocols

malicious HTML

excessive request timeouts

Never allow arbitrary backend access to internal network addresses.

17. React Dashboard

Create a polished analyst-style dashboard.

Design language:

premium

modern

minimal

professional

data-driven

dark/light mode

responsive

accessible

Main navigation:

Dashboard
Analyze
Live News
Evidence
History
Analytics
Sources
Model Performance
Settings


18. Dashboard

Show:

Total Analyses
Verified
Likely True
Mixed
Likely False
Unverified
Average Confidence
Average Processing Time


Add charts:

verdict distribution

analyses over time

confidence distribution

source credibility distribution

model performance

evidence support vs contradiction

Use Recharts.

19. Analyze Page

Create a large input interface:

Analyze News

[ Paste Article URL ]

OR

[ Article Headline ]

[ Article Content ]

[ Analyze Article ]


Also support:

Upload TXT


After analysis show:

VERDICT
LIKELY FALSE

Confidence
87%

ML Prediction
81%

Evidence Support
22%

Contradicting Evidence
91%

Source Credibility
74%


20. Explainability UI

Create an explanation section:

Why this result?

✓ Existing fact-check contradicts the claim
✓ Multiple independent sources report conflicting information
✓ Linguistic model detected suspicious patterns
✓ Source has limited historical evidence
✓ Claim could not be corroborated by strong sources


Add highlighted article text where possible.

Use SHAP or another appropriate explainability method for the ML component.

Do not fabricate explanations.

Every displayed explanation must map to an actual model/evidence signal.

21. Evidence Cards

Each evidence result should display:

[SUPPORTING]

Article headline

Publisher
Published date

Semantic match: 91%
Source credibility: 84%

Why relevant:
This article independently reports...

[Open Source]


For contradicting evidence:

[CONTRADICTING]


For neutral evidence:

[NEUTRAL]


Clearly distinguish evidence from the final verdict.

22. Source Analysis

Create a source panel:

Publisher
example.com

Credibility Score
74 / 100

Signals

✓ Author identified
✓ Publisher information available
✓ Multiple independent references
⚠ Limited historical verification data


Never state that a source is fake solely because its credibility score is low.

23. History

Users should be able to view:

Date
Article
Verdict
Confidence
Processing Time
Model Version


Add:

search

filters

sorting

pagination

delete

open analysis

24. Compare Articles

Create an optional comparison page.

Allow users to compare multiple articles covering the same event.

Display:

Article A
Article B
Article C

Common claims
Conflicting claims
Different statistics
Different sources
Publication timeline
Semantic similarity


Highlight contradictions.

25. Live News

Create a live-news page.

Use the news provider API.

Features:

search

category filters

country

date

publisher

newest

relevance

Each article should have:

Analyze


button.

Do not expose provider API keys in React.

26. Analytics

Create an analytics dashboard.

Show:

Total articles analyzed
Fake/false predictions
Likely true predictions
Mixed results
Unverified results
Average confidence
Average inference time
Top publishers
Most analyzed topics
Evidence retrieval success rate


Model metrics:

Accuracy
Precision
Recall
F1
ROC-AUC
Confusion Matrix


27. Performance

Target low-latency local ML inference.

Measure actual latency.

Do not claim:

"Sub-200ms"

unless benchmarks demonstrate it.

Separate:

ML inference latency


from:

complete verification latency


because external web searches can be much slower than local model inference.

Show:

ML inference: 48ms
Evidence retrieval: 620ms
Fact-check lookup: 240ms
Total verification: 931ms


Use parallel requests where safe.

Cache repeated queries.

28. Error Handling

Create consistent API errors:

{
  "error": {
    "code": "ARTICLE_EXTRACTION_FAILED",
    "message": "Unable to extract readable article content.",
    "request_id": "..."
  }
}


Handle:

API timeout

provider rate limits

invalid URLs

empty article

extraction failure

unavailable model

database errors

Redis errors

malformed input

The application must degrade gracefully.

For example:

If the external fact-check API fails:

Fact-check service temporarily unavailable.
ML analysis and other evidence sources are still available.


Do not crash the complete analysis.

29. Observability

Implement:

request IDs

structured JSON logs

latency tracking

model version logging

external API timing

error logging

database query timing where appropriate

Track:

request_id
endpoint
status
latency
model_version
external_services_used


Never log secrets or sensitive article content unnecessarily.

30. Testing

Create comprehensive tests.

Backend:

tests/
├── test_auth.py
├── test_analysis.py
├── test_ml.py
├── test_factcheck.py
├── test_news_search.py
├── test_evidence.py
├── test_sources.py
└── test_api.py


Test:

valid article

empty article

invalid URL

malformed JSON

API failure

timeout

database failure

prediction response

evidence ranking

fact-check matching

authentication

rate limiting

Frontend:

component tests

API mocks

loading states

error states

empty states

responsive behavior

31. Docker

Create:

Dockerfile
docker-compose.yml
.dockerignore


Services:

frontend
backend
postgres
redis


Optional:

nginx


Use multi-stage Docker builds where appropriate.

32. Project Structure

Use:

veritas-ai/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── ml/
│   │   ├── utils/
│   │   └── config/
│   ├── tests/
│   ├── migrations/
│   ├── requirements.txt
│   └── run.py
│
├── ml/
│   ├── datasets/
│   ├── preprocessing/
│   ├── features/
│   ├── training/
│   ├── evaluation/
│   ├── inference/
│   └── artifacts/
│
├── docker/
├── docs/
├── scripts/
├── .env.example
├── docker-compose.yml
├── README.md
└── .gitignore


33. Environment Variables

Create:

FLASK_ENV=development
DATABASE_URL=
REDIS_URL=

NEWS_API_KEY=
GOOGLE_FACTCHECK_API_KEY=

MODEL_PATH=
MODEL_VERSION=

JWT_SECRET_KEY=
CORS_ORIGINS=


Never put secrets directly into source code.

34. API Documentation

Generate OpenAPI/Swagger documentation.

Document:

authentication

request schemas

response schemas

error responses

rate limits

example requests

example responses

35. README

Create a professional README containing:

Project Overview
Architecture
Features
Tech Stack
System Architecture
ML Pipeline
Dataset
Model Evaluation
Real-Time Verification
Database Schema
API Documentation
Environment Variables
Installation
Development
Docker Setup
Testing
Deployment
Security
Limitations
Future Improvements


Include an architecture diagram using Mermaid.

36. Important Scientific Limitation

Explicitly document:

Fake-news detection is not equivalent to factual verification.

The system should therefore use language such as:

"Likely true"

"Likely false"

"Mixed evidence"

"Unverified"

"Insufficient evidence"

instead of pretending that the classifier can determine objective truth in every case.

The UI must clearly communicate uncertainty.

37. Final UX Flow

Implement this complete flow:

User
 ↓
Paste URL/article/claim
 ↓
Validate input
 ↓
Extract article
 ↓
Clean text
 ↓
Extract claims
 ↓
ML classification
 ↓
Generate semantic embeddings
 ↓
Search current news
 ↓
Search existing fact checks
 ↓
Retrieve evidence
 ↓
Calculate source signals
 ↓
Semantic matching
 ↓
Evidence fusion
 ↓
Generate explainable result
 ↓
Store analysis
 ↓
React dashboard
 ↓
User sees verdict + confidence + evidence + sources + explanation


38. Production Quality Rules

Do NOT:

hard-code fake API responses

create fake news search results

fabricate fact-check sources

fabricate model accuracy

expose API keys

use fake confidence scores

use placeholder analytics after implementation

call an article "fake" merely because the classifier says so

treat lack of evidence as evidence of falsehood

rely on only one external source

use Flask development server in production

ignore API failures

ignore database migrations

skip validation

skip tests

When an external API is unavailable, implement a clean fallback and clearly communicate that the evidence source was unavailable.

39. Deliverables

Produce a fully working application with:

React frontend

Flask backend

PostgreSQL database

Redis caching

ML training pipeline

TF-IDF baseline

transformer embeddings

hybrid classifier

live news search

Google Fact Check integration

evidence retrieval

semantic matching

source credibility analysis

explainable AI

authentication

analysis history

analytics dashboard

article comparison

Swagger/OpenAPI

Docker configuration

automated tests

production configuration

complete README

.env.example

40. Development Strategy

Do not generate the entire application as one unstructured file.

Build it incrementally:

Phase 1:
Database + Flask API + React shell

Phase 2:
ML preprocessing + TF-IDF baseline

Phase 3:
Transformer embeddings + hybrid classifier

Phase 4:
News search integration

Phase 5:
Fact-check integration

Phase 6:
Evidence retrieval + semantic ranking

Phase 7:
Source credibility engine

Phase 8:
Explainability

Phase 9:
Dashboard + analytics + history

Phase 10:
Authentication + security

Phase 11:
Testing + Docker

Phase 12:
Production optimization

After each phase:

run tests

fix errors

verify API contracts

verify frontend integration

document the implementation

Start by creating the complete architecture, folder structure, database schema, API contracts, and implementation plan. Then implement the application phase by phase without skipping production concerns.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://verilens-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e44314a7-ef66-4152-b340-0b539d225828).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
