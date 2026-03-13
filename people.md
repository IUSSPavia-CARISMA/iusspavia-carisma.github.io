---
layout: page
title: People
permalink: /people/
---

<div class="prose-block page-section">
  <h2>Head of Research Centre</h2>
  {% assign head = site.people | where: "slug", "marco-gaetani" | first %}
  {% if head %}
  <div class="people-grid">
    <article class="person-card">
      <a href="{{ head.url | relative_url }}" class="person-card-link">
        <div class="person-card-photo">
          {% if head.photo and head.photo != "" %}
            <img src="{{ head.photo | relative_url }}" alt="{{ head.name }}">
          {% else %}
            <div class="person-photo-placeholder">{{ head.name | slice: 0 }}</div>
          {% endif %}
        </div>
        <div class="person-card-info">
          <h3 class="person-card-name">{{ head.name }}</h3>
          <p class="person-card-position">{{ head.position }}</p>
        </div>
      </a>
      <div class="person-card-links">
        {% if head.email and head.email != "" %}
          <a href="mailto:{{ head.email }}" title="Email" class="person-link-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </a>
        {% endif %}
        {% if head.iuss_page and head.iuss_page != "" %}
          <a href="{{ head.iuss_page }}" target="_blank" rel="noreferrer" title="IUSS Page" class="person-link-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
          </a>
        {% endif %}
      </div>
    </article>
  </div>
  {% endif %}
</div>

<div class="prose-block page-section">
  <h2>Team Members</h2>
  <div class="people-grid">
    {% assign all_members = site.people | where_exp: "person", "person.slug != 'marco-gaetani'" | sort: "name" %}
    {% for person in all_members %}
    <article class="person-card">
      <a href="{{ person.url | relative_url }}" class="person-card-link">
        <div class="person-card-photo">
          {% if person.photo and person.photo != "" %}
            <img src="{{ person.photo | relative_url }}" alt="{{ person.name }}">
          {% else %}
            <div class="person-photo-placeholder">{{ person.name | slice: 0 }}</div>
          {% endif %}
        </div>
        <div class="person-card-info">
          <h3 class="person-card-name">{{ person.name }}</h3>
          <p class="person-card-position">{{ person.position }}</p>
        </div>
      </a>
      <div class="person-card-links">
        {% if person.email and person.email != "" %}
          <a href="mailto:{{ person.email }}" title="Email" class="person-link-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </a>
        {% endif %}
        {% if person.iuss_page and person.iuss_page != "" %}
          <a href="{{ person.iuss_page }}" target="_blank" rel="noreferrer" title="IUSS Page" class="person-link-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
          </a>
        {% endif %}
      </div>
    </article>
    {% endfor %}
  </div>
</div>

<div class="prose-block page-section">
  <h2>Former Members</h2>
  <ul class="plain-list former-list">
    {% for person in site.lab.people.former_members %}
    <li>
      <span>{{ person.name }}</span>
    </li>
    {% endfor %}
  </ul>
</div>
