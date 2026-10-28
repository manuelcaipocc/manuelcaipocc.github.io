---
title: 'An Edge-Oriented Architecture for State-Based Remaining Useful Life Prediction in Hydraulic Systems'
  
authors:
  - admin

sitemap:
  disable: true
author_notes:
  - 'Published in Discover Mechanical Engineering (Springer Nature)'

date: '2026-03-01T00:00:00Z'
publishDate: '2026-03-01T00:00:00Z'

doi: '10.1007/s44245-026-00364-y'
publication_types: ['article-journal']

publication: '*Discover Mechanical Engineering* (Springer Nature)'
publication_short: 'Discover Mech. Eng.'

abstract: >
  Predictive maintenance in hydraulic systems is constrained in practice by the
  absence of run-to-failure data, limited component-level observability, and
  disconnected data pipelines between PLC-level operational events and
  machine-learning-based prognostics. This paper presents an edge-oriented
  prototype architecture that integrates these elements into a prototype-level state-based predictive maintenance workflow for hydraulic and fluid power
  systems.

  The central methodological contribution is a formal state-transition Remaining
  Useful Life (RUL) formulation, which defines RUL as the remaining time, or number
  of hydraulic cycles, before the system transitions from nominal to PLC-supported
  abnormal or critical operation. This definition provides an operational prognostic
  target without requiring complete run-to-failure trajectories. Supporting this
  formulation, an OPC~UA-based acquisition and ETL framework aligns
  high-frequency hydraulic sensor data, multi-resolution storage, and PLC-based
  event logs into a structured data backbone for the investigated prototype.

  The framework is evaluated on a real PLC-controlled electro-hydraulic prototype
  operated across 15 repeated sessions at 100~ms resolution. Latent operating
  states are inferred using K-Means and Hidden Markov Models and evaluated against
  PLC-based operational reference logs. K-Means achieved an accuracy of 0.737 and
  a binary anomaly F1-score of 0.938, while the HMM achieved an accuracy of 0.749,
  a macro F1-score of 0.635, and a binary anomaly F1-score of 0.933. For RUL
  estimation, XGBoost achieved a test MAE of 3.916~min and a median prognostic
  horizon of 34.068~min for the first abnormal transition ($R^2=0.911$), while
  LSTM-Attention achieved the best critical RUL performance with a test MAE of
  3.467~min, a median prognostic horizon of 39.662~min, and $R^2=0.964$. SHAP, PDP, and
  attention-based analyses indicated that the models relied mainly on
  hydraulically plausible variables, including cylinder velocity, pressure ratios,
  oil flow rate, and cycle-level descriptors, supporting physical consistency
  without claiming causal inference.

  The results provide prototype-level evidence that structured event logging,
  unsupervised state modeling, and state-transition RUL estimation can be integrated
  into a coherent hydraulic PdM architecture under practically relevant PLC-integrated
  constraints, including the absence of run-to-failure labels and restricted
  component-level observability.


summary: >
  Journal article (Discover Mechanical Engineering, Springer Nature) presenting an edge-oriented architecture for state-based RUL prediction in hydraulic systems using PLC event logs, OPC UA data acquisition, unsupervised state modeling, and machine-learning-based prognostics.
  
featured: true

url_source: 'https://link.springer.com/article/10.1007/s44245-026-00364-y'
url_pdf: 'https://link.springer.com/content/pdf/10.1007/s44245-026-00364-y.pdf'

image:
  caption: 'An Edge Oriented Architecture for State Based Remaining Useful Life Prediction in Hydraulic Systems'
  focal_point: ''
  preview_only: false
---