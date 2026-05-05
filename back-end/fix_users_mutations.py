import re

with open('/home/vivian/FFSD/28_NexCare/back-end/src/users/users.service.ts', 'r') as f:
    content = f.read()

# Fix create()
content = content.replace("this.users.push(newUser);", "const currentUsers = this.users;\n      currentUsers.push(newUser);\n      this.users = currentUsers;")

# Fix update() - wait ArrayUtil.updateById mutates.
update_match = re.search(r"const updatedUser = ArrayUtil\.updateById\(this\.users, id, \{(.*?)\}\);", content, re.DOTALL)
if update_match:
    original = update_match.group(0)
    replacement = "const currentUsers = this.users;\n      const updatedUser = ArrayUtil.updateById(currentUsers, id, {" + update_match.group(1) + "});\n      this.users = currentUsers;"
    content = content.replace(original, replacement)

# Fix delete()
delete_match = re.search(r"ArrayUtil\.removeById\(this\.users, id\);", content)
if delete_match:
    content = content.replace("ArrayUtil.removeById(this.users, id);", "const currentUsers = this.users;\n      ArrayUtil.removeById(currentUsers, id);\n      this.users = currentUsers;")

# Fix updateStatus()
status_match = re.search(r"const updatedUser = ArrayUtil\.updateById\(this\.users, id, \{(.*?)\}\);", content, re.DOTALL)
if status_match: # Note: this might match the same block as before if updateById is identical.
    pass

# We should do a more robust replace for ArrayUtil.updateById
# Find all occurrences of ArrayUtil.updateById(this.users, ...)
content = content.replace("ArrayUtil.updateById(this.users", "ArrayUtil.updateById(currentUsers")
# Wait, let's just use Python's re to do the safe replacements where we first grab this.users

def replace_mutation(match):
    return "const currentUsers = this.users;\n      " + match.group(0).replace("this.users", "currentUsers") + "\n      this.users = currentUsers;"

# Reset content
with open('/home/vivian/FFSD/28_NexCare/back-end/src/users/users.service.ts', 'r') as f:
    content = f.read()

content = re.sub(r'this\.users\.push\([^)]+\);', replace_mutation, content)
content = re.sub(r'const updatedUser = ArrayUtil\.updateById\(this\.users[^;]+;', replace_mutation, content)
content = re.sub(r'ArrayUtil\.removeById\(this\.users[^;]+;', replace_mutation, content)

with open('/home/vivian/FFSD/28_NexCare/back-end/src/users/users.service.ts', 'w') as f:
    f.write(content)

print("users.service.ts mutations patched!")
