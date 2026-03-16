#!/usr/bin/env ruby
# frozen_string_literal: true

require 'roo'
require 'time'
require 'set'

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


def extract_surname(full_name)
  surname, = parse_name_parts(full_name)
  surname
end


def extract_initials(full_name)
  _, initials = parse_name_parts(full_name)
  initials
end


def initial_token?(token)
  cleaned = normalize_space(token).gsub(/[^A-Za-z.]/, '')
  return false if cleaned.empty?
  return true if cleaned.match?(/\A([A-Za-z]\.)+\z/)
  return true if cleaned.match?(/\A[A-Za-z]{1,3}\.?\z/)

  false
end


def initials_from_tokens(tokens)
  tokens.map do |token|
    cleaned = token.to_s.gsub(/[^A-Za-z]/, '')
    next '' if cleaned.empty?
    token.to_s.include?('.') ? cleaned : cleaned[0]
  end.join.upcase
end


def parse_name_parts(full_name)
  name = normalize_space(full_name)
  return ['', ''] if name.empty?

  if name.include?(',')
    surname = normalize_space(name.split(',', 2).first.to_s)
    given = normalize_space(name.split(',', 2).last.to_s)
    initials = initials_from_tokens(given.split(/\s+/))
    return [surname, initials]
  end

  tokens = name.split(/\s+/)
  return [tokens.first.to_s, ''] if tokens.length == 1

  # Case: "I. Surname"
  if initial_token?(tokens.first) && !initial_token?(tokens.last)
    return [tokens.last, initials_from_tokens(tokens[0...-1])]
  end

  # Case: "Surname I." or "Surname I.J."
  trailing = []
  idx = tokens.length - 1
  while idx >= 0 && initial_token?(tokens[idx])
    trailing.unshift(tokens[idx])
    idx -= 1
  end
  unless trailing.empty? || idx < 0
    surname = tokens[0..idx].join(' ')
    return [surname, initials_from_tokens(trailing)]
  end

  # Fallback case: "GivenName Surname"
  [tokens.last, initials_from_tokens(tokens[0...-1])]
end


def apply_to_unbolded_segments(text, pattern)
  text.split(/(\*\*[^*]+\*\*)/).map do |segment|
    if segment.start_with?('**') && segment.end_with?('**')
      segment
    else
      segment.gsub(pattern) { |m| "**#{m}**" }
    end
  end.join
end


def surname_to_regex(surname)
  escaped_parts = normalize_space(surname).split(/\s+/).map { |part| Regexp.escape(part) }
  escaped_parts.join('\s+')
end


def bold_surnames(citation, carisma_authors)
  text = citation.to_s.dup
  author_block, remainder = text.split(':', 2)
  author_block ||= ''

  prepared_authors = carisma_authors.map do |author|
    name = normalize_space(author)
    surname = extract_surname(name)
    initials = extract_initials(name)
    [name, surname, initials]
  end.reject { |_, surname, _| surname.empty? }

  # Apply more specific variants first (e.g., "Massano L.T." before "Massano L.")
  prepared_authors.sort_by! do |name, surname, initials|
    [-surname.length, -initials.length, -name.length]
  end

  prepared_authors.each do |author, surname, initials|
    next if surname.empty?

    surname_pattern = surname_to_regex(surname)
    generic_initials_pattern = '[A-Z](?:\.[A-Z])*\.?(?:\s+[A-Z](?:\.[A-Z])*\.?)*'
    initials_pattern = if initials.empty?
                         generic_initials_pattern
                       else
                         chars = initials.chars.map { |c| Regexp.escape(c) }
                         chars.join('\.?\s*') + '\.?'
                       end

    patterns = [
      # "I. Surname", "I.J. Surname"
      /(?<![[:alpha:]*])(#{initials_pattern}\s+#{surname_pattern})(?![[:alpha:]*])/i,
      # "Surname, I.", "Surname, I.J.", "Surname, I. J."
      /(?<![[:alpha:]*])(#{surname_pattern},\s*#{initials_pattern})(?![[:alpha:]*])/i,
      # "Surname I.", "Surname I.J.", "Surname I. J."
      /(?<![[:alpha:]*])(#{surname_pattern}\s+#{initials_pattern})(?![[:alpha:]*])/i
    ]
    # Use surname-only fallback only when no initials are available.
    if initials.empty?
      patterns << /(?<![[:alpha:]*])(#{surname_pattern})(?![[:alpha:]*])/i
    end

    patterns.each do |pattern|
      previous = author_block
      author_block = apply_to_unbolded_segments(author_block, pattern)
      break if author_block != previous
    end
  end

  text = remainder ? "#{author_block}:#{remainder}" : author_block
  normalize_space(text)
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

# Build a global CARISMA author list so all known CARISMA authors are bolded
# wherever they appear in the citation author list.
all_carisma_authors = Set.new
(2..sheet.last_row).each do |i|
  row_data = sheet.row(i)
  row = headers.each_with_index.to_h { |header, idx| [header, row_data[idx]] }

  [
    value_for(row, ['carisma 1st author']),
    value_for(row, ['carisma other authors (1)']),
    value_for(row, ['carisma other authors (2)']),
    value_for(row, ['carisma other authors (3)']),
    value_for(row, ['carisma other authors (4)'])
  ].each do |name|
    all_carisma_authors << name unless name.empty?
  end
end

(2..sheet.last_row).each do |i|
  row_data = sheet.row(i)
  row = headers.each_with_index.to_h { |header, idx| [header, row_data[idx]] }

  authors = value_for(row, ['authors'])
  title = value_for(row, ['title'])
  journal = value_for(row, ['journal'])
  year = value_for(row, ['year'])
  doi = value_for(row, ['doi'])

  # Filter to only 2024-2025 publications
  year_int = year.to_s.to_i
  next unless year_int >= 2024 && year_int <= 2025

  citation = build_citation(
    authors: authors,
    title: title,
    journal: journal,
    year: year,
    doi: doi
  )
  next if citation.empty?

  rows << {
    citation: bold_surnames(citation, all_carisma_authors.to_a),
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
output << "  <p>List of peer-reviewed scientific articles published in 2024-2025.</p>\n\n"

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
