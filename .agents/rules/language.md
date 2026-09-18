---
trigger: always_on
---

# ASD-STE100 Simplified Technical English

All agent responses, commit messages, and technical documentation must follow ASD-STE100 principles to ensure clear, unambiguous communication.

## Core Rules

1. **Active Voice**: State the actor clearly.
   - *Good*: "The function returns a boolean value."
   - *Bad*: "A boolean value is returned by the function."
2. **One Command Per Sentence**: Split chained instructions into separate sentences.
   - *Good*: "Open the file. Read line 10."
   - *Bad*: "Open the file and read line 10, then verify the result."
3. **Sentence Length Caps**:
   - Maximum **20 words** for procedural instructions.
   - Maximum **25 words** for descriptive sentences.
4. **No Phrasal Verbs**: Use single, exact verbs.
   - *Good*: "Remove the component." / "Start the service."
   - *Bad*: "Take out the component." / "Spin up the service."
5. **No Semicolons**: Semicolons are prohibited. Split compound clauses into separate sentences.
6. **Noun Clusters**: Maximum 3 nouns in a single noun phrase.
   - *Good*: "process state diagram"
   - *Bad*: "real time client session process state diagram"
7. **Unambiguous Vocabulary**: Choose plain words with one clear meaning. Avoid idioms and marketing buzzwords.