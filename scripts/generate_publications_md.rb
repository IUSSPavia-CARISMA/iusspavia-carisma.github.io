#!/usr/bin/env ruby
# frozen_string_literal: true

require 'roo'
require 'time'

XLSX_PATH = File.expand_path('../assets/CARISMA_publications.xlsx', __dir__)
OUTPUT_PATH = File.expand_path('../publications.md', __dir__)


def normalize_space(text)
  text.to_s.gsub(/\s+/, ' ').strip
end


def value_for(row, keys)
  keys.each do |key|
    value = normalize_space(row[key])
    return value unless value.empty?
  end
  ''
end


def first_author_surname(authors)
  normalize_space(authors).split(',', 2).first.to_s.strip.downcase
end


def bold_surname(citation, surname)
  text = citation.to_s.dup
  key = normalize_space(surname)
  return normalize_space(text) if key.empty?

  pattern = /(?<!\p{L})(#{Regexp.escape(key)})(?!\p{L})/i
  normalize_space(text.gsub(pattern) { |m| "**#{m}**" })
end


def ensure_trailing_period(text)
  value = normalize_space(text)
  return '' if value.empty?
  return value if value.end_with?('.', '!', '?')

  "#{value}."
end


def build_citation(authors:, title:, journal:, year:, doi:)
  citation = +''
  doi_text = normalize_space(doi)
  doi_value = doi_text.sub(%r{\Ahttps?://(dx\.)?doi\.org/}i, '')
  doi_part = doi_text.empty? ? '' : "[#{doi_text}](https://doi.org/#{doi_value})"

  unless authors.empty?
    citation << authors
    citation << ': ' unless title.empty?
  end

  citation << title unless title.empty?
  citation << ", #{journal}" unless journal.empty?
  citation << ", #{doi_part}" unless doi_part.empty?
  citation << ", #{year}" unless year.empty?

  ensure_trailing_period(citation)
end

rows = []

xlsx = Roo::Spreadsheet.open(XLSX_PATH)
sheet = xlsx.sheet(0)
headers = sheet.row(1).map { |h| h.to_s.strip.downcase }

(2..sheet.last_row).each do |i|
  row_data = sheet.row(i)
  row = headers.each_with_index.to_h { |header, idx| [header, row_data[idx]] }

  carisma = value_for(row, ['carisma', 'author surname'])
  authors = value_for(row, ['authors', 'author'])
  title = value_for(row, ['title'])
  journal = value_for(row, ['journal'])
  year = value_for(row, ['year'])
  doi = value_for(row, ['doi'])

  citation = build_citation(
    authors: authors,
    title: title,
    journal: journal,
    year: year,
    doi: doi
  )
  next if citation.empty?

  rows << {
    citation: bold_surname(citation, carisma),
    first_author: first_author_surname(authors)
  }
end

rows.sort_by! { |r| r[:first_author] }


def markdown_to_html(text)
  text.gsub(/\*\*(.+?)\*\*/, '<strong>\1</strong>')
      .gsub(/\[([^\]]+)\]\(([^)]+)\)/, '<a href="\2">\1</a>')
end


output = +"---\n"
output << "layout: page\n"
output << "title: Publications\n"
output << "permalink: /publications/\n"
output << "---\n\n"
output << "<div class=\"prose-block page-section\">\n"
output << "  <h2>Publications</h2>\n"
output << "  <p>List of peer-review scientific articles published in 2025.</p>\n\n"

if rows.empty?
  output << "  <p>No publications found.</p>\n"
else
  output << "  <ul class=\"plain-list\">\n"
  rows.each do |entry|
    output << "    <li>#{markdown_to_html(entry[:citation])}</li>\n"
  end
  output << "  </ul>\n"
end

output << "</div>\n"

File.write(OUTPUT_PATH, output)
puts "Wrote #{OUTPUT_PATH} (#{rows.length} entries)"
