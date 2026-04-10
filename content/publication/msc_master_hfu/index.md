---
title: 'Fluid 4.0-Compliant Framework for Digital Representation and Graph-Based Neural Modeling'

authors:
  - Manuel Alberto Caipo Ccoa
sitemap:
  disable: true
date: '2026-03-16T00:00:00Z'
publishDate: '2026-03-16T00:00:00Z'

publication_types: ['thesis']

publication: "Master's Thesis, Hochschule Furtwangen"
publication_short: 'M.Sc. Thesis, HFU'

abstract: >
  Fluid 4.0 was conceived as a standardized digitalization framework for industrial hydraulics, enabling machine-readable and vendor-independent descriptions of hydraulic components through the Asset Administration Shell (AAS). While existing Fluid 4.0 submodels primarily focus on identification, documentation, and operational data, they do not explicitly capture the physical and operational relationships required for explainable condition monitoring and predictive maintenance.

  This thesis extends Fluid 4.0 by introducing a dedicated submodel for condition monitoring relationships, in which degradation mechanisms, operating regimes, and physical constraints are formalized using causal graph structures. The proposed submodel embeds physically grounded knowledge into the AAS, enabling condition states to be represented in a structured and semantically interpretable manner.

  The framework is validated through two complementary investigations at component and system level. At component level, an axial piston pump is analyzed using a normalized degradation coefficient α_deg that isolates geometric wear by explicitly accounting for pressure and viscosity influences. Multiple degradation trends are identified under distinct operating states and combined into a physically interpretable health indicator. These relationships are encoded within a causal degradation graph and integrated into the Fluid 4.0 AAS.

  At system level, an electro-hydraulic actuator operating under accelerated degradation conditions is investigated. Degradation is interpreted as a progressive transition between statistically inferred operating regimes rather than as an explicitly labeled failure process. Data-driven explainability methods, including SHAP analysis and attention mechanisms, reveal strong dependency on dataset distribution and operating context, highlighting the limitations of purely correlation-based interpretations.

  These findings underline the necessity of grounding system-level condition assessment in physically validated component-level representations. The thesis further proposes a graph-informed formulation for Remaining Useful Life (RUL) estimation that leverages physically interpretable, component-level health indicators as structured state variables. This formulation provides a conceptual basis for structural regularization in predictive modeling while preserving causal traceability.

  Overall, this work establishes a scalable foundation for embedding physically grounded, causal, and semantically consistent condition monitoring knowledge into Fluid 4.0-compliant digital twins, enabling more robust and trustworthy predictive maintenance in industrial hydraulic systems.

summary: >
  Master’s thesis on extending Fluid 4.0 with causal graph-based condition monitoring representations for explainable diagnostics and predictive maintenance in hydraulic systems.

featured: true

doi: '10.5281/zenodo.19391364'
url_source: 'https://opus.hs-furtwangen.de/frontdoor/index/index/docId/13026'
url_pdf: 'https://doi.org/10.5281/zenodo.19391364'

image:
  caption: 'Fluid 4.0-compliant framework for digital representation and graph-based neural modeling'
  focal_point: ''
  preview_only: false

---