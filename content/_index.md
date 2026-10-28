---
title: "Manuel Caipo"
date: 2025-03-08
type: landing
description: "Personal website of Manuel Caipo, Machine Learning Engineer and AI Researcher focused on agentic AI, physics-aware machine learning, and explainable fault diagnosis for cyber-physical systems."

design:
  spacing: "5.5rem"

sitemap:
  disable: false

# Custom blocks live in layouts/partials/blox/community/mc-*.html; profile data in content/authors/admin/_index.md
sections:
  - block: mc-intro
    id: about
    content:
      username: admin
      primary_action:
        text: Download CV
        url: /uploads/resume.pdf
      secondary_action:
        text: Get in touch
        url: /#contact
    design:
      spacing:
        padding: ["6.5rem", 0, "4rem", 0]

  - block: mc-highlights
    id: highlights
    content:
      title: Highlights
      subtitle: Papers, awards and new chapters, year by year.
      items:
        - date: '2026-06-01'
          milestone: true
          title: Started my Ph.D. at TUM in cooperation with Mercedes-Benz AG.
          text: Context-aware multimodal learning and agentic LLM approaches for fault analysis in software-intensive eDrive systems, at the Chair of Sustainable Mobile Drivetrains.
          url: https://www.mos.ed.tum.de/nma/team/manuel-caipo/
        - date: '2026-05-01'
          year_only: true
          milestone: true
          title: Paper published in *Discover Mechanical Engineering* (Springer Nature).
          text: An edge-oriented architecture for state-based remaining useful life prediction in hydraulic systems.
          url: https://link.springer.com/article/10.1007/s44245-026-00364-y
        - date: '2026-04-01'
          title: Graduated M.Sc. Advanced Precision Engineering, Hochschule Furtwangen.
          text: Master's thesis at Bosch Rexroth on an ML/AI-based condition monitoring module for hydraulic systems (Fluid 4.0).
          url: https://doi.org/10.5281/zenodo.19391364
        - date: '2025-10-01'
          title: Exchange semester in Computational Science and Engineering at Ulm University.
          text: Numerical optimization and high-performance computing.
        - date: '2024-11-01'
          title: Joined Bosch Rexroth AG as Data Scientist Working Student.
          text: Scalable ETL pipelines for high-frequency hydraulic data and ML/DL models for anomaly detection and RUL prediction.
        - date: '2024-09-01'
          title: Started the M.Sc. Advanced Precision Engineering.
          text: Hochschule Furtwangen University.
        - date: '2022-07-01'
          milestone: true
          title: Innova 2022 Triple Award Winner at Freeport-McMoRan.
          text: 1st Place Digital Transformation, Showroom Award and President's Award for RUL-based proactive maintenance, **+1.5% asset availability (≈$10M/year)**.
        - date: '2022-02-01'
          title: Postgraduate Diploma in Machine Learning & Deep Learning.
          text: Universidad Católica San Pablo, 19.6/20.0.
        - date: '2021-04-01'
          title: Started as Junior Data Scientist at Freeport-McMoRan.
          text: ML/DL models in Azure ML for wear and RUL prediction of critical mining assets.
        - date: '2021-01-01'
          year_only: true
          title: Outstanding Bachelor's Thesis Award, Engineering Sciences.
          text: Design of a 350 TPH copper concentrate conveyor belt with automatic hydraulic tensioning.
        - date: '2019-12-01'
          milestone: true
          title: Top Graduate (Top 1%), Mechanical Engineering, UNSA.
          text: Officially recognized by the German State.
        - date: '2019-06-01'
          year_only: true
          title: Research Grant, SERESSA 2019, Spain.
          text: 15th International School on Radiation Effects.
        - date: '2017-03-01'
          year_only: true
          title: President of the Republic Scholarship, Peru.
          text: Full scholarship awarded for academic excellence (Top 1%).
    design:
      css_class: mc-alt

  - block: mc-research
    id: publications
    content:
      title: Featured research
      subtitle: Physics-aware, explainable machine learning for engineering systems, from hydraulic prognostics to graph-based modeling.
      featured_count: 3
      lead: Hydraulic
      scholar:
        text: Google Scholar
        url: https://scholar.google.com/citations?user=yvkSMx8AAAAJ&hl=es&oi=ao

  - block: mc-experience
    id: experience
    content:
      username: admin
      title: Experience
      subtitle: Teams and institutions that shaped my path, from mining to automotive.
    design:
      css_class: mc-alt

  - block: mc-interests
    id: interests
    content:
      username: admin
      title: Interests
      subtitle: What I explore beyond the day-to-day, and the tools I build to understand it.
      lab:
        label: Lab
        title: Numerical Methods Simulator
        text: An interactive simulator of numerical methods, from optimizers on loss landscapes to classic solvers, with precomputed trajectories so it runs instantly in the browser.
        tags: [Gradient descent, Optimizers, Numerical solvers]
        path: lab

  - block: mc-skills
    id: skills
    content:
      username: admin
      title: Skills
      subtitle: Tools and methods I use to take models from data to deployment.
      awards_title: Awards & scholarships
    design:
      css_class: mc-alt

  - block: mc-contact
    id: contact
    content:
      title: Let's
      accent: connect
      text: Always happy to talk about agentic AI, physics-aware ML, fault diagnosis, or research collaborations.
      buttons:
        - text: E-mail
          icon: at-symbol
          url: mailto:manuel.caipo@tum.de
        - text: Connect
          icon: brands/linkedin
          url: https://www.linkedin.com/in/manuel-caipo-89845b151/
        - text: GitHub
          icon: brands/github
          url: https://github.com/manuelcaipocc
---
