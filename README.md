# Attention, in the order it happened

ERA V5 · Session 8 assignment. A static web app that explains every attention mechanism from the session, **in the order each one was launched**, each one framed as an answer to a bill that standard attention sent (T² compute, a linear-growing KV cache, or position that attention cannot supply itself).

- **Live site (Netlify):** https://era-v5-s08-attention-timeline.netlify.app/
- **Mirror (GitHub Pages):** https://truesrini.github.io/era-v5-s08-attention-timeline/
- **Repository:** https://github.com/truesrini/era-v5-s08-attention-timeline (checked out locally as `Ex08`)

## What is on the page

1. **Standard attention, computed live**: six tokens, four dimensions, with every step (`Q·Kᵀ → scale → mask → softmax → weighted sum of V`) shown as numbers. Turn off the causal mask to watch weight leak into the future.
2. **The two bills**: a KV-cache calculator on the class yardstick (48 layers, head dim 128, bf16) showing which factor of `2 × layers × kv_heads × head_dim × T × bytes` each mechanism cuts.
3. **The timeline at a glance**: a swimlane by bill (compute, KV memory, position, exact access) with the five phases the field went through, and dashed arcs from the day an idea was published to the day a major model shipped it. Also a chart of **taught order versus launch order**.
4. **30 mechanism cards in launch order**: the problem at that moment, the mechanism, the formula, an interactive visual, what it buys, what it gives up, when I would pick it, and a verdict for four workloads (2K chatbot, 32K RAG, 256K documents, 1M-token agent).
5. **What the timeline shows** that a list does not, and a labelled guess at what comes next.
6. **Which one would I pick?**: all verdicts in one grid.
7. **Corrections**: places where the Session 8 notes or transcript disagree with the primary sources.
8. **Sources** for every date.

All 18 mechanisms from the class list are covered. Two of them get two cards each because they have two distinct launch dates: sparse attention (fixed patterns, Apr 2019; top-k, Dec 2019) and DeepSeek's sparse attention (DSA's indexer, Sep 2025; CSA/HCA compression, Apr 2026). Ten mechanisms that were not covered in class were added (tagged *Added* on the page): Bahdanau additive attention (2014), relative position representations (2018), Transformer-XL segment recurrence (2019), FlashAttention (2022), Position Interpolation (2023), Mamba (2023), Native Sparse Attention (2025), gated attention (2025), the Qwen3-Next hybrid schedule (2025) and Kimi Delta Attention (2025).

## How the dates were checked

**Convention.** The date shown is the date the mechanism first became public:

- **Papers:** the arXiv **v1 submission date** (UTC), read from each paper's arXiv abstract page ("Submission history"). Conference dates are later and are not used.
- **Model releases:** the vendor's own **release note** (DeepSeek API news pages), cross-checked with the Hugging Face model card and config.
- **The one forum post (NTK-aware scaling):** the post's own creation timestamp (`created_utc` 1688026889 = 29 Jun 2023 08:21 UTC), retrieved through the Arctic Shift Reddit archive API because reddit.com itself was not reachable; it is the same post the YaRN paper cites as "bloc97 2023a".

Every date was looked up for this assignment; none was taken from memory or from the class notes. Where only the month could be pinned (Qwen3-Next), the page says so.

### Sources for every date

| Date used | Mechanism | In class list | Primary source for the date |
|---|---|---|---|
| 2014-09-01 | Additive attention (Bahdanau) | Added | [Bahdanau, Cho, Bengio — arXiv 1409.0473 v1](https://arxiv.org/abs/1409.0473) |
| 2017-05-08 | Absolute learned positions | Yes | [Gehring et al., ConvS2S — arXiv 1705.03122 v1 (cited as the learned option in the Transformer paper, §3.5)](https://arxiv.org/abs/1705.03122) |
| 2017-06-12 | Scaled dot-product attention + multi-head | Yes | [Vaswani et al., 'Attention Is All You Need' — arXiv 1706.03762 v1](https://arxiv.org/abs/1706.03762) |
| 2017-06-12 | Sinusoidal positions | Yes | [Vaswani et al. — arXiv 1706.03762 v1, §3.5](https://arxiv.org/abs/1706.03762) |
| 2018-03-06 | Relative position representations | Added | [Shaw, Uszkoreit, Vaswani — arXiv 1803.02155 v1](https://arxiv.org/abs/1803.02155) |
| 2019-01-09 | Segment recurrence (Transformer-XL) | Added | [Dai et al. — arXiv 1901.02860 v1](https://arxiv.org/abs/1901.02860) |
| 2019-04-23 | Fixed sparse attention (Sparse Transformer) | Yes | [Child, Gray, Radford, Sutskever — arXiv 1904.10509 v1](https://arxiv.org/abs/1904.10509) |
| 2019-11-06 | Multi-query attention (MQA) | Yes | [Shazeer, 'Fast Transformer Decoding: One Write-Head is All You Need' — arXiv 1911.02150 v1](https://arxiv.org/abs/1911.02150) |
| 2019-12-25 | Top-k attention (Explicit Sparse Transformer) | Yes | [Zhao et al. — arXiv 1912.11637 v1](https://arxiv.org/abs/1912.11637) |
| 2020-04-10 | Sliding-window attention | Yes | [Beltagy, Peters, Cohan, Longformer — arXiv 2004.05150 v1](https://arxiv.org/abs/2004.05150) |
| 2020-06-29 | Linear attention | Yes | [Katharopoulos et al., 'Transformers are RNNs' — arXiv 2006.16236 v1](https://arxiv.org/abs/2006.16236) |
| 2021-02-22 | Delta rule (DeltaNet) | Yes | [Schlag, Irie, Schmidhuber, 'Linear Transformers Are Secretly Fast Weight Programmers' — arXiv 2102.11174 v1](https://arxiv.org/abs/2102.11174) |
| 2021-04-20 | Rotary position embedding (RoPE) | Yes | [Su et al., RoFormer — arXiv 2104.09864 v1](https://arxiv.org/abs/2104.09864) |
| 2021-08-27 | ALiBi (linear biases) | Yes | [Press, Smith, Lewis, 'Train Short, Test Long' — arXiv 2108.12409 v1](https://arxiv.org/abs/2108.12409) |
| 2022-05-27 | FlashAttention (exact, IO-aware) | Added | [Dao et al. — arXiv 2205.14135 v1](https://arxiv.org/abs/2205.14135) |
| 2023-05-22 | Grouped-query attention (GQA) | Yes | [Ainslie et al. — arXiv 2305.13245 v1](https://arxiv.org/abs/2305.13245) |
| 2023-06-27 | Position Interpolation | Added | [Chen et al. (Meta) — arXiv 2306.15595 v1](https://arxiv.org/abs/2306.15595) |
| 2023-06-29 | NTK-aware RoPE scaling | Yes | [u/bloc97, r/LocalLLaMA post 14lz7j5 (created 29 Jun 2023 08:21 UTC; cited as 'bloc97 2023a' in the YaRN paper)](https://www.reddit.com/r/LocalLLaMA/comments/14lz7j5/ntkaware_scaled_rope_allows_llama_models_to_have/) |
| 2023-08-31 | YaRN | Yes | [Peng, Quesnelle, Fan, Shippole — arXiv 2309.00071 v1](https://arxiv.org/abs/2309.00071) |
| 2023-09-29 | Attention sinks (StreamingLLM) | Yes | [Xiao et al., 'Efficient Streaming Language Models with Attention Sinks' — arXiv 2309.17453 v1](https://arxiv.org/abs/2309.17453) |
| 2023-12-01 | Selective state spaces (Mamba) | Added | [Gu & Dao — arXiv 2312.00752 v1](https://arxiv.org/abs/2312.00752) |
| 2024-05-07 | Multi-head latent attention (MLA) | Yes | [DeepSeek-AI, DeepSeek-V2 — arXiv 2405.04434 v1](https://arxiv.org/abs/2405.04434) |
| 2024-12-09 | Gated DeltaNet | Yes | [Yang, Kautz, Hatamizadeh — arXiv 2412.06464 v1](https://arxiv.org/abs/2412.06464) |
| 2025-02-16 | Native Sparse Attention (NSA) | Added | [Yuan et al. (DeepSeek-AI & PKU) — arXiv 2502.11089 v1](https://arxiv.org/abs/2502.11089) |
| 2025-05-10 | Gated attention (output gate) | Added | [Qiu et al. (Qwen) — arXiv 2505.06708 v1](https://arxiv.org/abs/2505.06708) |
| Sep 2025 | Hybrid depth schedule (Qwen3-Next) | Added | [Qwen3-Next-80B-A3B model card (layout '12 × (3 × Gated DeltaNet → 1 × Gated Attention)'); vLLM day-0 support post dated 11 Sep 2025](https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct) |
| 2025-09-29 | DeepSeek Sparse Attention (DSA) | Yes | [DeepSeek release note 'Introducing DeepSeek-V3.2-Exp', 29 Sep 2025](https://api-docs.deepseek.com/news/news250929/) |
| 2025-10-30 | Kimi Delta Attention (Kimi Linear) | Added | [Kimi Team, 'Kimi Linear' — arXiv 2510.26692 v1](https://arxiv.org/abs/2510.26692) |
| 2025-12-13 | DroPE (drop positional embeddings) | Yes | [Gelberg, Eguchi, Akiba, Cetin (Sakana AI) — arXiv 2512.12167 v1](https://arxiv.org/abs/2512.12167) |
| 2026-04-24 | Compressed Sparse + Heavily Compressed Attention (DeepSeek-V4) | Yes | [DeepSeek release note 'DeepSeek-V4 Preview Release', 24 Apr 2026; tech report arXiv 2606.19348 v1 (26 Apr 2026); released config.json](https://api-docs.deepseek.com/news/news260424/) |

### Other dates used on the page

| Claim | Source |
|---|---|
| Learned positions were the alternative the Transformer paper compared against | arXiv 1706.03762 §3.5 cites Gehring et al. [9] for learned positional embeddings |
| Local (block) attention, 15 Feb 2018 | Image Transformer, [arXiv 1802.05751](https://arxiv.org/abs/1802.05751) v1 |
| DeltaNet parallel training algorithm, 10 Jun 2024 | Yang et al., [arXiv 2406.06484](https://arxiv.org/abs/2406.06484) v1 |
| Dynamic NTK, 30 Jun 2023 | u/emozilla, r/LocalLLaMA post 14mrgpr (`created_utc` 1688103246), cited by YaRN |
| NTK "by-parts" fix, PR opened 7 Jul 2023 | [jquesnelle/scaled-rope#1](https://github.com/jquesnelle/scaled-rope/pull/1) |
| PaLM uses multi-query attention and RoPE (Apr 2022) | PaLM, [arXiv 2204.02311](https://arxiv.org/abs/2204.02311), §2 Model Architecture |
| Llama 2 34B/70B use GQA (Jul 2023) | Llama 2, [arXiv 2307.09288](https://arxiv.org/abs/2307.09288), §2.2 |
| Mistral 7B ships SWA + GQA, 10 Oct 2023 | [arXiv 2310.06825](https://arxiv.org/abs/2310.06825) v1 |
| Qwen3-Next layout `12 × (3 × Gated DeltaNet → 1 × Gated Attention)`, 48 layers, 262,144 native context | [Qwen3-Next-80B-A3B-Instruct model card](https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct); [vLLM post, 11 Sep 2025](https://vllm.ai/blog/2025-09-11-qwen3-next) |
| DeepSeek-V4 details: `compress_ratios` 4 / 128, `index_topk` 1024, `sliding_window` 128, `num_key_value_heads` 1, `qk_rope_head_dim` 64, `rope_scaling` YaRN factor 16 over 65,536 | [DeepSeek-V4-Pro config.json](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/config.json) |
| DeepSeek-V4-Pro: 27% of V3.2's single-token FLOPs and 10% of its KV cache at 1M | [DeepSeek-V4-Pro model card](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro) |
| MLA: d_c = 512, decoupled RoPE 64, cache ≈ GQA with 2.25 groups | DeepSeek-V2, [arXiv 2405.04434](https://arxiv.org/abs/2405.04434), Table 1 |
| DroPE recalibration: 20B tokens for Llama-2-7B (≈0.5% of pretraining), recalibrated at the original length | [arXiv 2512.12167](https://arxiv.org/abs/2512.12167); [Sakana AI page](https://sakana.ai/drope/) |
| Titans (mentioned in "what comes next"), 31 Dec 2024 | [arXiv 2501.00663](https://arxiv.org/abs/2501.00663) v1 |
| Delta rule origin | Widrow & Hoff, "Adaptive switching circuits", IRE WESCON Convention Record, 1960 |

## Corrections to the class

1. **DroPE is a published method, not an unknown one.** The Session 8 notes say the record does not establish the DroPE algorithm or which rotary dimensions it changes. DroPE is Gelberg, Eguchi, Akiba and Cetin (Sakana AI), arXiv 2512.12167, 13 Dec 2025, with code at github.com/SakanaAI/DroPE. It removes RoPE from **all** layers after pretraining and runs a short recalibration at the original context length; it does not modify particular rotary dimensions. The class's V4 applying it "before annealing" is consistent with this.
2. **DeltaNet is from 2021, not 2024.** The transcript says the DeltaNet paper came out in 2024. The delta-rule linear transformer is Schlag, Irie and Schmidhuber, arXiv 2102.11174, 22 Feb 2021. The 2024 paper (Yang et al., 10 Jun 2024) made it trainable in parallel. The rule itself is Widrow and Hoff, 1960.
3. **DeepSeek did not invent sparse attention.** The transcript says it did. Sparse Transformer (OpenAI), arXiv 1904.10509, 23 Apr 2019; top-k attention, arXiv 1912.11637, 25 Dec 2019. DeepSeek's contributions are NSA (Feb 2025), DSA (Sep 2025) and CSA/HCA (Apr 2026).
4. **The Transformer is from 2017.** The transcript says "2018 and 17"; arXiv v1 is 12 Jun 2017.
5. **Attention compute grows quadratically, not exponentially** (the transcript says "exponentially"; the notes correctly say T²).
6. **"Native" 1M still stretches positions.** DeepSeek-V4's released config sets YaRN with factor 16 over 65,536 positions, so the "build long" road also uses a positional extension. The two roads combine.

## Run it locally

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Deploy

- **Netlify:** "Add new site → Import an existing project → GitHub → truesrini/era-v5-s08-attention-timeline". `netlify.toml` publishes the repo root, so no settings are needed. Name the site `era-v5-s08-attention-timeline` to match the links above. Or drag the `Ex08` folder onto app.netlify.com/drop.
- **GitHub Pages** serves the same files from `main` at the mirror URL above.

## Files

```
Ex08/  (repo root)
  netlify.toml    Netlify config (publish the root, no build)
  index.html      page structure and section text
  css/style.css   layout, light and dark themes
  js/data.js      every mechanism: date, source, problem, mechanism, pros, cons, verdicts
  js/viz.js       the small interactive visuals in each card
  js/app.js       the attention demo, cache calculator, timeline charts, tables
```

Toy numbers in the demos are illustrative. Numbers about real models come from the linked sources.
