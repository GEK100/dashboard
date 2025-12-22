# Production-First Development Skill

## Core Principle
**NO WORKAROUNDS. NO TEMPORARY FIXES. EVERYTHING MUST WORK FIRST TIME.**

## Mandatory Process for Every Change

### 1. PLAN PHASE (Required Before Any Code)
Before making ANY change to the codebase, you MUST:

- **Define the Goal**: Clearly state what needs to be accomplished
- **Identify Dependencies**: What systems, files, APIs, or components are affected?
- **Map the Impact**: How will this change ripple through the application?
- **Risk Assessment**: What could go wrong? What are the edge cases?
- **Rollback Strategy**: If this fails, how do we revert cleanly?

### 2. DESIGN PHASE
- **Architecture First**: Design the solution for production, not for "getting it working"
- **No Placeholders**: No TODO comments, no "we'll fix this later", no mock data that stays
- **Proper Error Handling**: Every failure mode must be considered and handled
- **Security by Design**: Validate inputs, sanitize outputs, protect against common vulnerabilities
- **Performance Considerations**: Will this scale? What's the performance impact?

### 3. IMPLEMENTATION PHASE
- **Production-Grade Code**: Write it right the first time
- **Proper Integration**: Use real APIs, real databases, real services - no mocks unless explicitly for testing
- **Complete Features**: Finish the entire feature, don't leave it half-done
- **Type Safety**: Use TypeScript properly, no `any` types unless absolutely justified
- **Validation**: All user inputs validated, all external data sanitized

### 4. VERIFICATION PHASE
- **Test the Change**: Does it work as intended?
- **Test Edge Cases**: Does it handle errors gracefully?
- **Test Integration**: Does it work with the rest of the system?
- **Verify No Regressions**: Did we break anything else?

## Forbidden Practices

### ❌ NEVER DO THIS:
- Hardcoded credentials or API keys
- setTimeout/setInterval to "fix" race conditions (fix the race condition properly)
- try/catch with empty catch blocks
- Disabling ESLint rules without explanation
- "It works on my machine" solutions
- Copying code without understanding it
- Quick fixes that create technical debt
- Placeholder UI that ships to production
- Fake data in production builds
- Commented-out code left in the codebase

## Quality Checklist

Before considering any change complete, verify:

- [ ] All error scenarios are handled gracefully
- [ ] User-facing error messages are helpful and professional
- [ ] No console.log statements left in production code
- [ ] All TypeScript types are properly defined
- [ ] No security vulnerabilities introduced
- [ ] Performance is acceptable under load
- [ ] Code is properly documented where complexity exists
- [ ] No magic numbers or unclear variable names
- [ ] All external dependencies are necessary and vetted
- [ ] Mobile/responsive design works (if applicable)
- [ ] Accessibility standards met (if applicable)

## Decision Framework

When facing a choice, always ask:

1. **Is this production-ready?** If no, don't ship it
2. **Will this scale?** If no, redesign it
3. **Is this secure?** If unsure, research and verify
4. **Can this fail gracefully?** If no, add proper error handling
5. **Would I trust this with real user data?** If no, it's not ready

## Communication Protocol

When planning changes:
- Present the full plan before implementation
- Explain the rationale for design decisions
- Highlight potential risks and mitigation strategies
- Get user approval for architectural decisions
- Document assumptions and constraints

## Remember

**Speed is important, but correctness is critical. A feature that works perfectly on the second deployment is better than a feature that breaks in production and requires five emergency patches.**

**Measure twice, cut once. Code once, deploy confidently.**
