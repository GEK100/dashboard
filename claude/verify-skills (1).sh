#!/bin/bash

# Skill Verification Script
# This script checks that your skills are properly set up for Claude Code

echo "========================================="
echo "  Claude Code Skills Verification"
echo "========================================="
echo ""

# Check if skills directory exists
if [ ! -d "/mnt/skills/user" ]; then
    echo "❌ ERROR: /mnt/skills/user directory does not exist!"
    echo "   Claude Code won't be able to find your skills."
    exit 1
fi

echo "✅ Skills directory exists: /mnt/skills/user"
echo ""

# List all user skills
echo "📁 Your installed skills:"
skill_count=0
for skill_dir in /mnt/skills/user/*/; do
    if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")
        echo "  - $skill_name"
        skill_count=$((skill_count + 1))
        
        # Check for SKILL.md file
        if [ -f "${skill_dir}SKILL.md" ]; then
            echo "    ✅ SKILL.md found"
            
            # Check if file has content
            if [ -s "${skill_dir}SKILL.md" ]; then
                word_count=$(wc -w < "${skill_dir}SKILL.md")
                echo "    ✅ File has content (${word_count} words)"
                
                # Check for critical sections
                if grep -q "## Overview\|## CRITICAL" "${skill_dir}SKILL.md"; then
                    echo "    ✅ Contains proper sections"
                else
                    echo "    ⚠️  WARNING: Missing key sections (Overview or CRITICAL)"
                fi
            else
                echo "    ❌ ERROR: SKILL.md is empty!"
            fi
        else
            echo "    ❌ ERROR: SKILL.md not found!"
        fi
        echo ""
    fi
done

if [ $skill_count -eq 0 ]; then
    echo "❌ No skills found in /mnt/skills/user/"
    echo "   Create skills in: /mnt/skills/user/skill-name/SKILL.md"
    exit 1
fi

echo "========================================="
echo "✅ Found $skill_count skill(s) installed"
echo "========================================="
echo ""
echo "💡 Tips for ensuring Claude reads your skills:"
echo "   1. Mention skill name in your prompts: 'Use the component skill'"
echo "   2. Look for Claude's confirmation message before code generation"
echo "   3. If Claude skips patterns, explicitly say: 'Read the skill first'"
echo ""
echo "🔍 To view a skill:"
echo "   cat /mnt/skills/user/nextjs-components/SKILL.md"
echo ""
