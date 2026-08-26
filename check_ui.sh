#!/bin/bash
echo "Running UI validations..."

# 1. Type Checking
echo "Type checking..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed!"
    exit 1
fi

# 2. JSX literal newline checking
echo "Checking for literal newlines in JSX..."
grep -rn "className=.*\\\n" src/
if [ $? -eq 0 ]; then
    echo "❌ Found literal newlines in JSX string attributes (e.g. className). These cause build/render errors!"
    exit 1
fi

# 3. Build Check
echo "Testing UI build..."
npx vite build
if [ $? -ne 0 ]; then
    echo "❌ Vite build failed!"
    exit 1
fi

echo "✅ All UI validations passed! The UI features are safely integrated."
