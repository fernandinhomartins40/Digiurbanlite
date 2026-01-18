import re

file_path = r"digiurban\backend\src\services\bot\FlowManager.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern para encontrar return { ... cards: [ ... ], ... }
# Substitui cards: [ por metadata: { cards: [
content = re.sub(
    r'(return\s*\{[^}]*messageType:\s*[\'"]card[\'"][^}]*)\bcards:\s*\[',
    r'\1metadata: { cards: [',
    content
)

# Pattern para encontrar return { ... quickReplies: [ ... ], ... }
# Substitui quickReplies: [ por metadata: { quickReplies: [
content = re.sub(
    r'(return\s*\{[^}]*)\bquickReplies:\s*\[',
    r'\1metadata: { quickReplies: [',
    content
)

# Fechar metadata após os arrays
# Encontra ], que fecha cards ou quickReplies e adiciona }
content = re.sub(
    r'(metadata:\s*\{\s*(?:cards|quickReplies):\s*\[[^\]]*\])\s*,?\s*\n\s*\}',
    r'\1 } }',
    content,
    flags=re.MULTILINE
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("FlowManager.ts fixed!")
