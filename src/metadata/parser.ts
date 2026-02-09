import YAML from "yaml";

export interface MetadataResult {
  metadata: Record<string, any>;
  content: string;
  hasMetadata: boolean;
}

/**
 * Parse YAML frontmatter from document
 */
export function parseMetadata(source: string): MetadataResult {
  // Default result
  const result: MetadataResult = {
    metadata: {},
    content: source,
    hasMetadata: false,
  };

  // Check if starts with ---
  if (!source.trimStart().startsWith("---")) {
    return result;
  }

  // Find second ---
  const lines = source.split("\n");
  let metadataEndIndex = -1;

  // Skip first --- line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined && line.trim() === "---") {
      metadataEndIndex = i;
      break;
    }
  }

  // No closing ---
  if (metadataEndIndex === -1) {
    return result;
  }

  // Extract YAML content (between first and second ---)
  const yamlContent = lines.slice(1, metadataEndIndex).join("\n");

  // Extract remaining content (after second ---)
  const remainingContent = lines.slice(metadataEndIndex + 1).join("\n");

  try {
    // Parse YAML
    const metadata = YAML.parse(yamlContent);

    return {
      metadata: metadata || {},
      content: remainingContent,
      hasMetadata: true,
    };
  } catch (error) {
    // Invalid YAML - return original
    console.error("Failed to parse YAML metadata:", error);
    return result;
  }
}

/**
 * Extract metadata and return processed content
 */
export function extractMetadata(source: string): {
  variables: Record<string, any>;
  source: string;
} {
  const { metadata, content, hasMetadata } = parseMetadata(source);

  return {
    variables: metadata,
    source: hasMetadata ? content : source,
  };
}
