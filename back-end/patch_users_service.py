import re

with open('/home/vivian/FFSD/28_NexCare/back-end/src/users/users.service.ts', 'r') as f:
    content = f.read()

# Add fs and path imports if not present
if "import * as fs" not in content:
    content = content.replace("import { Injectable } from '@nestjs/common';", "import { Injectable } from '@nestjs/common';\nimport * as fs from 'fs';\nimport * as path from 'path';")

# Find the start of private users: User[] = [
match = re.search(r'  private users: User\[\] = \[', content)
if match:
    start_idx = match.start()
    
    # Find the end of the array by matching brackets
    open_brackets = 0
    in_array = False
    end_idx = -1
    
    for i in range(start_idx, len(content)):
        if content[i] == '[':
            in_array = True
            open_brackets += 1
        elif content[i] == ']':
            open_brackets -= 1
            if in_array and open_brackets == 0:
                # Need to find the semicolon after ]
                semi_idx = content.find(';', i)
                end_idx = semi_idx + 1 if semi_idx != -1 else i + 1
                break
                
    if end_idx != -1:
        replacement = """
  private readonly usersFilePath = path.join(process.cwd(), 'data', 'users.json');

  private get users(): User[] {
    try {
      const raw = fs.readFileSync(this.usersFilePath, 'utf-8');
      return JSON.parse(raw) as User[];
    } catch {
      return [];
    }
  }

  private set users(val: User[]) {
    try {
      fs.mkdirSync(path.dirname(this.usersFilePath), { recursive: true });
      fs.writeFileSync(this.usersFilePath, JSON.stringify(val, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist users to disk:', err);
    }
  }
"""
        content = content[:start_idx] + replacement.strip() + "\n" + content[end_idx:]

with open('/home/vivian/FFSD/28_NexCare/back-end/src/users/users.service.ts', 'w') as f:
    f.write(content)

print("users.service.ts patched!")
