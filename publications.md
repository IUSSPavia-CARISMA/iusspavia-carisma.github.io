---
layout: page
title: Publications
permalink: /publications/
---

<div class="prose-block">
  <p>Publications are available through the IUSS Pavia research profiles of CARISMA members.</p>
  <ul class="link-list">
    {% for item in site.lab.publications %}
    <li><a href="{{ item.url }}" target="_blank" rel="noreferrer">{{ item.name }}</a></li>
    {% endfor %}
  </ul>
</div>
