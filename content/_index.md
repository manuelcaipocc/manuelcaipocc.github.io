---
# Leave the homepage title empty to use the site title
title: "Manuel Caipo"
date: 2025-03-08
type: landing
description: "Personal website of Manuel Caipo, Machine Learning Engineer and AI Researcher focused on agentic AI, physics-aware machine learning, and explainable fault diagnosis for cyber-physical systems."

design:
  # Default section spacing
  spacing: "6rem"

sitemap:
  disable: False
sections:
  - block: hero
    demo: false # Only display this section in the Hugo Blox Builder demo site
    content:
      title: Physics-aware & Agentic AI for Engineering Systems
      text: PhD Candidate at Mercedes-Benz AG & Technical University of Munich
      primary_action:
        text: Explore research
        url: /#publications
        icon: arrow-down
      secondary_action:
        text: Download CV
        url: /uploads/resume.pdf
    design:
      css_class: hero-gradient
      spacing:
        padding: ["8rem", 0, "3rem", 0]
  - block: resume-biography-3
    id: about
    content:
      # Choose a user profile to display (a folder name within `content/authors/`)
      username: admin
      text: ""
      # Show a call-to-action button under your biography? (optional)
      button:
        text: Download CV
        url: /uploads/resume.pdf
    # design:
    #   css_class: dark
    #   background:
    #     color: '#242424'
    design:
      css_class: hero-gradient
      text_color_light: true
      avatar:
        size: xxl
        shape: circle
        process: false
        generation_size: "1200"
        # image:
        #   filename: iot1.png
        #   filters:
        #     brightness: 0.5
        # text_color_light: true
        # image:
        #   # Add your image background to `assets/media/`.
        #   filename: stacked-peaks.svg
        #   filters:
        #     brightness: 1.0
        #   size: cover
        #   position: center
        #   parallax: false
  # - block: markdown
  #   content:
  #     title: 'My Research'
  #     subtitle: ''
  #     text: |-
  #       Use this area to speak to your mission. I'm a research scientist in the Moonshot team at DeepMind. I blog about machine learning, deep learning, and moonshots.

  #       I apply a range of qualitative and quantitative methods to comprehensively investigate the role of science and technology in the economy.
        
  #       Please reach out to collaborate 
  #   design:
  #     columns: '1'
  # - block: collection
  #   id: news
  #   content:
  #     title: News
  #     subtitle: ''
  #     text: ''
  #     # Page type to display. E.g. post, talk, publication...
  #     page_type: post
  #     # Choose how many pages you would like to display (0 = all pages)
  #     count: 0
  #     # Filter on criteria
  #     filters:
  #       author: ""
  #       category: ""
  #       tag: ""
  #       exclude_featured: false
  #       exclude_future: false
  #       exclude_past: false
  #       publication_type: ""
  #     # Choose how many pages you would like to offset by
  #     offset: 0
  #     # Page order: descending (desc) or ascending (asc) date.
  #     order: desc
  #   design:
  #     # Choose a layout view
  #     view: date-title-summary
  #     # Reduce spacing
  #     spacing:
  #       padding: [0, 0, 0, 0]
  - block: markdown
    id: highlights
    content:
      title: Highlights
      text: |-
        <p class="section-lead">Milestones, papers and new chapters, year by year.</p>
        <ol class="milestones">
        <li class="milestone is-key"><span class="milestone-date">Jun 2026</span><h4>Started my Ph.D. at TUM in cooperation with Mercedes-Benz AG</h4><p>Context-aware multimodal learning and agentic LLM approaches for fault analysis in software-intensive eDrive systems, at the <a href="https://www.mos.ed.tum.de/nma/team/manuel-caipo/">Chair of Sustainable Mobile Drivetrains</a>.</p></li>
        <li class="milestone is-key"><span class="milestone-date">2026</span><h4>Paper published in <em>Discover Mechanical Engineering</em> (Springer Nature)</h4><p><a href="https://link.springer.com/article/10.1007/s44245-026-00364-y">An edge-oriented architecture for state-based remaining useful life prediction in hydraulic systems</a>.</p></li>
        <li class="milestone"><span class="milestone-date">Apr 2026</span><h4>M.Sc. Advanced Precision Engineering — Hochschule Furtwangen (grade 1.59)</h4><p>Master's thesis at Bosch Rexroth on an ML/AI-based condition monitoring module for hydraulic systems (Fluid 4.0).</p></li>
        <li class="milestone"><span class="milestone-date">Oct 2025</span><h4>Exchange semester in Computational Science and Engineering — Ulm University</h4><p>Numerical optimization and high-performance computing.</p></li>
        <li class="milestone is-key"><span class="milestone-date">2022</span><h4>Innova 2022 — Triple Award Winner at Freeport-McMoRan</h4><p>1st Place Digital Transformation, Showroom Award and President's Award for RUL-based proactive maintenance: <strong>+1.5% asset availability (≈$10M/year)</strong>.</p></li>
        <li class="milestone"><span class="milestone-date">2019</span><h4>Top Graduate (Top 1%) — Mechanical Engineering, UNSA</h4><p>President of the Republic Scholarship (Peru) and Outstanding Bachelor's Thesis Award.</p></li>
        </ol>
    design:
      columns: 1
  - block: collection
    id: publications
    content:
      title: Featured Research
      subtitle: Physics-aware, explainable machine learning for engineering systems.
      count: 0
      filters:
        folders:
          - publication
        featured_only: true
    design:
      view: article-grid
      columns: 2
  # - block: collection
  #   content:
  #     title: Recent Publications
  #     text: ""
  #     count: 0
  #     filters:
  #       folders:
  #         - publication
  #       exclude_featured: false
  #   design:
  #     view: citation
  - block: resume-experience
    id: experience
    content:
      username: admin
    design:
      # Hugo date format
      date_format: 'January 2006'
      # Education or Experience section first?
      is_education_first: false
  # - block: collection
  #   id: talks
  #   content:
  #     title: Recent & Upcoming Talks
  #     count: 0
  #     filters:
  #       folders:
  #         - event
  #   design:
  #     view: article-grid
  #     columns: 2
  # - block: collection
  #   id: platforms
  #   content:
  #     title: Robotic Platforms
  #     subtitle: I Learned and Grew up with
  #     count: 0
  #     filters:
  #       folders:
  #         - platform
  #   design:
  #     view: article-grid
  #     columns: 2
  - block: markdown
    id: contact
    content:
      title: Let's Connect
      text: |-
        <p class="section-lead">Always happy to talk about agentic AI, physics-aware ML, fault diagnosis, or research collaborations.</p>
    design:
      # Reduce spacing
      spacing:
        padding: [0, 0, 0, 0]
  - block: cta-button-list
    content:
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
    design:
      columns: 2

  # - block: cta-card
  #   demo: true # Only display this section in the Hugo Blox Builder demo site
  #   content:
  #     title: 👉 Build your own academic website like this
  #     text: |-
  #       This site is generated by Hugo Blox Builder - the FREE, Hugo-based open source website builder trusted by 250,000+ academics like you.

  #       <a class="github-button" href="https://github.com/HugoBlox/hugo-blox-builder" data-color-scheme="no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star HugoBlox/hugo-blox-builder on GitHub">Star</a>

  #       Easily build anything with blocks - no-code required!
        
  #       From landing pages, second brains, and courses to academic resumés, conferences, and tech blogs.
  #     button:
  #       text: Get Started
  #       url: https://hugoblox.com/templates/
  #   design:
  #     card:
  #       # Card background color (CSS class)
  #       css_class: "bg-primary-700"
  #       css_style: ""
---
