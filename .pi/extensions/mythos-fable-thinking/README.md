# Mythos-Fable Thinking Extension v2

Deep thinking patterns derived from analyzing 25K Mythos examples and 4,665 Fable-5 agent traces.

## Analysis Summary

### Fable-5 Patterns (from real agent traces)

**Decision Chain Structure:**
```
Alright, [acknowledge state]. [What I now know]. Since [causal connector], 
I need to [intent declaration]. Therefore, [specific action].
```

**Thinking Verbs (by frequency):**
1. "will" (1332) — commitment to action
2. "need to" (1292) — intent declaration  
3. "should" (1250) — obligation/recommendation
4. "can" (1180) — capability assessment
5. "must" (359) — strong obligation

**Reasoning Connectors:**
1. "because" (572) — causal explanation
2. "since" (541) — premise establishment
3. "therefore" (477) — conclusion drawing
4. "now that" (164) — state update
5. "given that" (161) — context acknowledgment

**Text Output Stats:**
- Median: 86 chars
- Mean: 341 chars
- Pattern: Status + what's next ("Renderer done. Now audio.")

**Tool Distribution:**
- 81% tool calls, 19% text
- Primary: Bash (1544), Edit (960), Read (443), Write (311)

### Mythos Patterns (from synthetic examples)

**Fixed Section Headers (by frequency):**
1. "Autonomous Decomposition & Threat Modeling" — 53
2. "Detailed Technical Analysis" — 53
3. "Recommended Defense-in-Depth Stack" — 53
4. "Agentic Recommendations" — 53
5. "Risk Quantification" — 53
6. "Problem Decomposition" — 39
7. "Key Optimizations Applied" — 39
8. "Multi-Perspective Frontier Analysis" — 35
9. "Technical Lens" / "Ethical Lens" / "Strategic Lens" — 35 each

**Core Characteristics:**
- Multi-vector decomposition (3-7 vectors per problem)
- Quantitative claims with specific metrics
- Cross-domain synthesis
- Security-first mindset
- Formal verification emphasis
- Agentic self-reference ("A Mythos-class system would...")

## Commands

| Command | Style | Best For |
|---------|-------|----------|
| `/thinking mythos` | Structured multi-vector analysis | Analysis, planning, architecture, security |
| `/thinking fable` | Observe→Think→Act execution | Building, coding, implementation |
| `/thinking combined` | Adaptive hybrid | General use (default) |
| `/thinking off` | Standard behavior | Disable injection |

## How It Works

Uses `before_agent_start` to inject thinking instructions into the system prompt. The model receives behavioral patterns as guidelines without changing the underlying model.

## Key Insight

The difference between the styles:
- **Mythos** thinks in vectors and synthesizes across domains
- **Fable** thinks in cycles and executes incrementally
- **Combined** detects task type and adapts

Both share: verification-seeking, causal reasoning, intent declaration, and concise communication.
