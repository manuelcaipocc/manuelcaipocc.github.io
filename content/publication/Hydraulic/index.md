---
title: 'Explainable Edge-AI Framework for Fault Diagnosis and Remaining Useful Life Prediction in Hydraulic Systems'

authors:
  - Faras Brumand-Poor
  - Manuel Caipo
  - Jörn Kretschmer
  - Maximilian Dommermuth
  - Katharina Schmitz

sitemap:
  disable: true
author_notes:
  - 'Preprint submitted to Discover Mechanical Engineering'

date: '2026-03-01T00:00:00Z'
publishDate: '2026-03-01T00:00:00Z'

publication_types: ['paper']

publication: 'Preprint submitted to Discover Mechanical Engineering'
publication_short: 'Discover Mechanical Engineering (submitted)'

abstract: >
  Predictive maintenance solutions for hydraulic systems often fail to reach industrial adoption, not due to insufficient model accuracy, but because of fragmented data infrastructures, missing operational context, and limited physical interpretability.

  This work proposes an edge-oriented, open-source framework for condition monitoring and Remaining Useful Life (RUL) estimation that addresses the minimum architectural and data requirements for production-grade deployment. The framework is designed as an event-driven and state-based pipeline, where operational events, component behavior, and sensor data are consistently aligned.

  Using a real hydraulic system controlled by an industrial PLC, machine states are identified through unsupervised clustering and Hidden Markov Models, enabling degradation-aware state transitions without explicit fault labels. RUL is formulated as the time to transition into economically non-viable operational states rather than catastrophic failure. Prognostic models based on LSTM with attention and XGBoost are complemented by explainability analyses (SHAP, PDP, attention maps) that link model outputs to physically meaningful hydraulic variables, enabling expert validation and operational trust.

  Experimental results show that the identified states and predicted RUL trajectories are consistent with logged downtime events and known physical degradation mechanisms, while explainability analyses confirm that statistically relevant features correspond to physically meaningful variables.

  The proposed architecture defines the minimum architectural structure required for edge-oriented deployment, enabling scalable, interpretable, and autonomous predictive maintenance solutions with direct relevance for production availability and Overall Equipment Effectiveness (OEE).

summary: >
  Preprint on an explainable edge-AI framework for fault diagnosis and remaining useful life prediction in PLC-integrated hydraulic systems.

featured: true

url_pdf: 'https://manuelcaipocc.github.io/cv-caipo-latex/cv_links/publications/Explainable_Edge_AI_Framework_for_Fault_Diagnosis_and_Remaining_Useful_Life_Springer_template.pdf'

image:
  caption: 'Explainable Edge-AI framework for hydraulic fault diagnosis and RUL prediction'
  focal_point: ''
  preview_only: false
---