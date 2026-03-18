---
layout: default
title: CARISMA
---

{% include hero-slider.html %}

<section class="centre-hero" markdown="0">
  <div class="container centre-hero-shell">
    <div class="centre-hero-main">
      <h1 class="centre-title">{{ site.lab.full_name }}</h1>
      <p class="centre-acronym">{{ site.lab.name }}</p>
      <p class="centre-summary">Research centre on climate change, impacts and risk management at <a href="{{ site.lab.iuss_pavia.href }}" target="_blank" rel="noreferrer">{{ site.lab.iuss_pavia.name }}</a></p>
    </div>
  </div>
</section>

<section class="centre-section" markdown="0">
  <div class="container prose-block">
    {% for paragraph in site.lab.overview.intro %}
    <p>{{ paragraph }}</p>
    {% endfor %}
    <h2>Main objectives</h2>
    <ul class="plain-list">
      {% for item in site.lab.overview.objectives %}
      <li>{{ item }}</li>
      {% endfor %}
    </ul>
  </div>
</section>

<section class="centre-section" markdown="0">
  <div class="container">
    <h2>Latest news</h2>
    <div class="news-grid">
      {% assign latest_news = site.news | sort: "date" | reverse %}
      {% for post in latest_news limit:3 %}
      <article class="news-card">
        <time class="news-card-date" datetime="{{ post.date | date_to_xmlschema }}">
          {{ post.date | date: "%B %-d, %Y" }}
        </time>
        <h3 class="news-card-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        <p class="news-card-excerpt">{{ post.excerpt | strip_html | truncatewords: 20 }}</p>
        <a href="{{ post.url | relative_url }}" class="news-card-link">Read more →</a>
      </article>
      {% endfor %}
    </div>
    <div class="news-view-all">
      <a href="{{ '/news/' | relative_url }}" class="btn btn-secondary">View all news</a>
    </div>
  </div>
</section>

<section class="centre-section" markdown="0">
  <div class="container">
    <h2>Latest publications</h2>
    <div class="publications-grid">
      {% for pub in site.lab.recent_publications limit:3 %}
      <article class="publication-card">
        <span class="publication-card-year">{{ pub.year }}</span>
        <h3 class="publication-card-title">{{ pub.title }}</h3>
        <p class="publication-card-authors">{{ pub.authors }}</p>
        <p class="publication-card-journal"><em>{{ pub.journal }}</em></p>
        <a href="{{ pub.doi }}" target="_blank" rel="noreferrer" class="publication-card-link">View publication →</a>
      </article>
      {% endfor %}
    </div>
    <div class="news-view-all">
      <a href="{{ '/publications/' | relative_url }}" class="btn btn-secondary">View all publications</a>
    </div>
  </div>
</section>
