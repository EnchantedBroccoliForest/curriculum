# Lesson plan and weekly log — one year

49 active weeks at about 6 hours: a 5-week CS primer (P1–P5), then 44 programme weeks, plus 3 unassigned buffer weeks. Weeks are numbered by active study week; the start date is unset until P1 begins. Lectures are named by topic because course numbering changes between offerings. Each week ends with the exercise in its row, done closed-book before any AI help. Set the status yourself or report the week to me and I set it, update the Curriculum tab's ledgers, and adjust later weeks.

Sources: [CS336](https://stanford-cs336.github.io/) · [Prince, Understanding Deep Learning](https://udlbook.github.io/udlbook/) · [Karpathy, Zero to Hero](https://karpathy.ai/zero-to-hero.html) · [nanochat](https://github.com/karpathy/nanochat) · [Sutton and Barto](http://incompleteideas.net/book/the-book-2nd.html) · [Spinning Up](https://spinningup.openai.com) · [How to Scale Your Model](https://jax-ml.github.io/scaling-book) · [Ultra-Scale Playbook](https://huggingface.co/spaces/nanotron/ultrascale-playbook) · [GPU MODE](https://github.com/gpu-mode/lectures) · [RLHF Book](https://rlhfbook.com) · Raschka, Build a Reasoning Model (From Scratch) · [Berkeley Agentic AI](https://rdi.berkeley.edu/agentic-ai/f25) · [Inspect](https://inspect.aisi.org.uk/) · [CS50P](https://cs50.harvard.edu/python/) · [Missing Semester](https://missing.csail.mit.edu/) · [MacKay](http://www.inference.org.uk/mackay/itila/) · [Labonne, LLM Course](https://github.com/EnchantedBroccoliForest/llm-course) (your fork of mlabonne/llm-course; its articles and Colab notebooks are the practitioner layer in weeks 9, 11, 18, 23, 26, and 28–39).

## CS primer (P1–P5)

| Wk | Topic | Resource | Exercise, closed-book | Hrs | Status |
| --- | --- | --- | --- | --- | --- |
| P1 | Programming 1: variables, control flow, functions, strings, lists, dictionaries | CS50P lectures 0–3; Think Python as reference | Five small programs without an agent: prime sieve, word count, a recursive function, a dictionary lookup, a file read | 6 | Not started |
| P2 | Programming 2 and numerical Python: classes, mutability, generators; arrays, shapes, broadcasting | CS50P lectures 4–8 (selected); NumPy quickstart; From Python to NumPy ch. 1–2 | Matrix class with operator overloading; matmul three ways, timed, ratio explained | 6 | Not started |
| P3 | Machine arithmetic and memory hierarchy: IEEE 754, bf16/fp16/fp8, cancellation; caches, bandwidth vs latency; what a GPU is | CS:APP 2.1–2.4, 6.1–6.4; Goldberg 1991 §1–2; GPU MODE lecture 4 | Why 0.1 + 0.2 ≠ 0.3; derive log-sum-exp; bf16 vs fp16; 4096² fp16 matmul time from FLOP/s and bandwidth | 6 | Not started |
| P4 | Algorithms and tooling: asymptotics, hash tables, graphs, topological sort; shell, git, environments, Jupyter, HTTP, JSON | Roughgarden Part 1 ch. 1–2 and graph search; Missing Semester 1, 2, 6; MDN HTTP overview | Complexity of attention in sequence length; topologically sort a computation graph by hand; clone nanochat, run its tests, trace one stack trace | 6 | Not started |
| P5 | Information theory: entropy, cross-entropy, KL, mutual information, source coding | MacKay ch. 1, 2, 4 | Cross-entropy as code length; perplexity as exp(entropy rate); tokenizer as compressor. Gate P: P3 and P5 redone closed-book | 6 | Not started |

## Phase 0 — Foundation (weeks 1–4)

| Wk | Lecture or chapter | Reading | Derivation or exercise | Hrs | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Closed-book diagnostic (items in the Curriculum tab); Karpathy micrograd video, coded along, part 1 | — | Ridge and cross-entropy gradients; error log; Value class with backward | 6 | Not started |
| 2 | micrograd finished; makemore part 1 watched | — | Gradient check against finite differences; one-page backprop-as-reverse-mode-AD derivation | 6 | Not started |
| 3 | PyTorch blitz; CS336 lectures: PyTorch and einops; GPUs and TPUs | Scaling book, rooflines chapter | micrograd's MLP in PyTorch, loss curve matched; roofline for one GPU | 6 | Not started |
| 4 | Experimental judgment: leakage, baselines, judges, contamination | Kapoor and Narayanan 2023; Zheng et al. 2023; one contamination analysis | Specify a paired comparison with uncertainty; one temporal-leakage case from quant work; annotate nanochat's training script. Pace review. Gate 0 | 6 | Not started |

## Phase 1 — Deep learning core (weeks 5–17)

| Wk | Lecture or chapter | Reading | Derivation or exercise | Hrs | Status |
| --- | --- | --- | --- | --- | --- |
| 5 | Prince ch. 3–5: shallow and deep networks, loss functions | — | Derive MSE and cross-entropy from maximum likelihood; universal-approximation sketch | 6 | Not started |
| 6 | Prince ch. 6–7: fitting, gradients, initialization | Adam 2014 | Adam's invariance in its precise form; backprop through a two-layer network; variance-preserving init | 6 | Not started |
| 7 | Prince ch. 8–9: performance, regularization | Nakkiran 2019; Power 2022; Dropout 2014 | Paper notes with the six judgment questions; one page on SGD's implicit regularization | 6 | Not started |
| 8 | Prince ch. 10–11: convolutions, residuals | ResNet 2015; Batch Normalization 2015 | Run a CIFAR-10 ResNet notebook; vary depth; write up the curves | 6 | Not started |
| 9 | Prince ch. 12: transformers | Attention Is All You Need 2017; Layer Normalization 2016; Alammar, Illustrated Word2Vec, and colah, Understanding LSTMs (one hour: what attention replaced) | Attention FLOPs and memory vs sequence length; causal mask by hand | 6 | Not started |
| 10 | Karpathy GPT video, part 1, coded along | — | Shapes at each step; one page on why each component exists | 6 | Not started |
| 11 | Karpathy GPT video, part 2; nanochat model file side by side | GPT-2 2019; BERT 2018 and ViT 2020 as notes; Labonne, Decoding Strategies in LLMs; Bycroft's LLM visualization | Toy GPT trained on a small corpus; list where nanochat differs (RoPE, RMSNorm, SwiGLU) and why | 6 | Not started |
| 12 | Prince ch. 14, 17: unsupervised learning, VAEs | Kingma and Welling 2013 | Derive the ELBO before reading the derivation | 6 | Not started |
| 13 | Prince ch. 18: diffusion | DDPM 2020; CLIP 2021 | Follow the DDPM loss derivation (reading); derive the contrastive objective; DDPM notebook optional | 6 | Not started |
| 14 | Sutton and Barto ch. 1–4; Prince ch. 19 | — | MDP, Bellman equations; policy iteration on a toy MDP by hand | 6 | Not started |
| 15 | Sutton and Barto ch. 13; Spinning Up policy-gradient pages | PPO 2017 | Policy gradient theorem; baseline variance-reduction argument; map Spinning Up's PPO code to the equations | 6 | Not started |
| 16 | Prince ch. 20: why does deep learning work? | Kaplan 2020; Chinchilla 2022 | Paper notes; what the power-law fit assumes and where it fails | 6 | Not started |
| 17 | Gate 1 | Catch-up | Closed-book: backprop through a transformer block; the ELBO; policy gradient with baseline. Competency rows 2–6 set | 6 | Not started |

## Phase 2 — Language models and systems (weeks 18–27)

| Wk | Lecture or chapter | Reading | Derivation or exercise | Hrs | Status |
| --- | --- | --- | --- | --- | --- |
| 18 | CS336: tokenization; architectures and hyperparameters | RoPE 2021 | BPE merges by hand (Karpathy's tokenization video as the guide); parameter count and per-token FLOPs of nanochat's model, checked against the code | 6 | Not started |
| 19 | CS336: attention alternatives | Mamba 2023 §1–3; LLaMA 1–3 reports, architecture and training sections | KV-cache size vs GQA groups and context; reconstruct LLaMA-3 8B training FLOPs and GPU-hours | 6 | Not started |
| 20 | CS336: GPUs; parallelism (overview) | Ultra-Scale Playbook, parallelism chapter and collectives appendix (read only) | Memory per GPU under data, tensor, and pipeline parallelism for a 7B model | 6 | Not started |
| 21 | — | Scaling book, inference chapters; FlashAttention 2022 | HBM traffic of standard vs tiled attention; when bandwidth-bound and when compute-bound | 6 | Not started |
| 22 | CS336: scaling laws | Sardana and Frankle 2023 | Fit an IsoFLOP frontier on supplied data; inference-aware optimum | 6 | Not started |
| 23 | CS336: data; evaluation | FineWeb and DCLM reports; HELM 2022; HF LLM Evaluation Guidebook; lm-evaluation-harness and Lighteval as the tools; one contamination study | Which filtering claims have controlled ablations; benchmark critique, first draft | 6 | Not started |
| 24 | — | Switch Transformer 2021; DeepSeek-V3 report (MLA, MoE) | Active vs total parameters; load balancing without auxiliary loss | 6 | Not started |
| 25 | — | DeepSeek-V4 report | Training budget reconstructed: reported, derived, unknown kept separate | 6 | Not started |
| 26 | CS336: inference | vLLM 2023; speculative decoding (Leviathan 2023); EAGLE-3 2025; HF Assisted Generation post; Databricks LLM inference best practices | Speedup vs acceptance rate; tokens per second per dollar for one open model on one GPU, checked against a published benchmark | 6 | Not started |
| 27 | Gate 2 | Catch-up; optional nanochat speedrun | Closed-book: training-step memory and FLOPs under tensor and data parallelism; 7B on 64 GPUs budget. Competency rows 5 and 7 set | 6 | Not started |

## Phase 3 — Post-training, practitioner stack, reasoning, agents, evaluation (weeks 28–40)

| Wk | Lecture or chapter | Reading | Derivation or exercise | Hrs | Status |
| --- | --- | --- | --- | --- | --- |
| 28 | RLHF Book: definitions, problem setup, preference data, reward modeling | InstructGPT 2022; Labonne §3 Post-training datasets (chat templates, synthetic data, quality filtering); HF chat-templating docs | KL-regularized objective from memory; Bradley-Terry likelihood and the reward-model loss; one paragraph on how a chat-template mismatch silently breaks a fine-tune | 6 | Not started |
| 29 | RLHF Book: instruction tuning, rejection sampling, policy gradients (PPO, GRPO) | Labonne §4 SFT (LoRA, QLoRA, TRL, Unsloth, Axolotl); Raschka, LoRA insights | PPO clipped objective and why it exists; LoRA parameter count and training memory for a 7B model at rank 16 versus full fine-tuning; run Labonne's Unsloth SFT Colab (guided, about 90 minutes) and read the TRL calls it makes | 6 | Not started |
| 30 | RLHF Book: direct alignment | DPO 2023; HF, Preference Tuning LLMs (DPO, IPO, KTO); the DPO W&B logs report | Derive DPO from the KL-regularized optimum plus Bradley-Terry; state the coverage assumption; list the DPO metrics to watch and what each trend means. Labonne's DPO Colab optional | 6 | Not started |
| 31 | Practitioner stack: quantization, serving, merging | Labonne, Introduction to Weight Quantization (absmax, zero-point, LLM.int8); Labonne §7 Quantization (GGUF and llama.cpp; GPTQ, AWQ, SmoothQuant at lecture level); Labonne §Engineer 1 and 7 (APIs, Ollama and LM Studio, vLLM and TGI); Labonne, Merge LLMs with mergekit | Memory of a 7B model at fp16, int8, int4 by hand; quantize a small model to GGUF (AutoQuant Colab or llama.cpp) and measure the perplexity change against bits; one page: the serving stack a team of yours would pick, and the cost per million tokens of each option | 6 | Not started |
| 32 | CS336: mid- and post-training; RLVR | Tülu 3 report; HF LLM Course ch. 12, Fine-tune with GRPO (optional run) | What the RLVR stage changed, from the ablations | 6 | Not started |
| 33 | Raschka ch. 1–3 and inference-time scaling | s1 2025; self-consistency 2022; HF, Scaling test-time compute (3B beating 70B on MATH-500) | Run the evaluation notebook; expected gain of best-of-n with a verifier as a function of n and verifier error; put the HF 3B-versus-70B claim through the six judgment questions, matched budgets first | 6 | Not started |
| 34 | Raschka: RLVR and GRPO chapters | DeepSeekMath 2024 | Run the GRPO notebook; derive the group-relative advantage estimator | 6 | Not started |
| 35 | — | DeepSeek-R1 2025; DAPO 2025; Dr. GRPO 2025; Yue et al. 2025 | One page on zero-variance groups and length bias; two-page RLVR-capability note | 6 | Not started |
| 36 | — | Constitutional AI 2022; sycophancy and reward-hacking papers; one frontier system card to its methods; CLIP, Flamingo, LLaVA quick reads; Karvonen, Intuitive Explanation of SAEs (one hour, lecture level) | System-card note | 6 | Not started |
| 37 | Berkeley Agentic AI lectures 1–3 and evaluation lecture | ReAct 2022; Reflexion 2023; RAG 2020; Labonne §Engineer 2–5 (embedding models and MTEB, chunking, hybrid retrieval and reranking, Ragas metrics: context precision and recall, faithfulness; prompt engineering guide skimmed; structured outputs); Anthropic, Building Effective Agents; MCP spec (reread the primer's HTTP and JSON notes); A2A as a note | Agent loop as a POMDP, one page; design the three-way comparison: task, untouched test set, metrics with retrieval and generation failure separated, abstention policy | 6 | Not started |
| 38 | Build and run week | Claude Agent SDK, OpenAI Agents SDK, or LangGraph docs as needed | Assemble with an agent SDK or coding agent; audit splits, metrics, retries; run; Inspect eval; reliability memo with a falsifiable criterion | 6 | Not started |
| 39 | Evaluation, safety, security | Judge-reliability literature; prompt injection and least privilege; OWASP LLM Top 10; Thacker, Prompt Injection Primer; Microsoft, Red teaming LLMs; garak as the tool; Agents' Last Exam 2026 | Benchmark critique, final; a page on agent-benchmark construct validity; a threat model for the week-38 agent against the OWASP Top 10 | 6 | Not started |
| 40 | Gate 3 and oral exam | — | Closed-book: DPO; the GRPO estimator. One-hour adversarial oral. Competency rows 8–11 set | 6 | Not started |

## Capstone (weeks 41–44)

| Wk | Work | Exercise | Hrs | Status |
| --- | --- | --- | --- | --- |
| 41 | Question and falsifier; protocol | Unit of analysis, splits, metric, baseline, stopping rule, budget (under $300 or none) | 6 | Not started |
| 42 | Agent runs baseline and experiment | Audit raw outputs; hand-check metric calculations | 6 | Not started |
| 43 | Write-up, four to six pages | Results with uncertainty; alternative explanations; failed tests | 6 | Not started |
| 44 | Oral defence | One hour, adversarial; delayed retest of three derivations; competency ledger finalized; one page on what to study next | 6 | Not started |

## Weekly log

One row per week, newest first. Report: week; dates; hours; what was done; what you can now derive or explain unaided; where you got stuck. Hours measure effort; a competency level is set only from the unaided column.

| Wk | Dates | Hrs | Done | Unaided derivation or answer | Stuck on |
| --- | --- | --- | --- | --- | --- |
| — | — | — | No weeks logged yet | — | — |
