---
layout: page
title: News
permalink: /news/
---

<div class="prose-block page-section">
  <h2>Latest news and updates</h2>
  <p class="section-intro">Below you can find the latest news, events, seminars, and updates from CARISMA. Stay informed about our research activities, upcoming workshops, and recent achievements.</p>
</div>

<div class="news-list">
  {% assign sorted_news = site.news | sort: "date" | reverse %}
  {% for post in sorted_news %}
  <article class="news-item news-item-bordered">
    <time class="news-date" datetime="{{ post.date | date_to_xmlschema }}">
      {{ post.date | date: "%B %-d, %Y" }}
    </time>
    <div class="news-content">
      <h3 class="news-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      <p class="news-excerpt">{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
      <a href="{{ post.url | relative_url }}" class="read-more">Read more →</a>
    </div>
  </article>
  {% endfor %}
</div>
