# AI Curriculum — One-Year Plan

Nov 5, 2026 · @enchantedbroccoli

## Target and what changed

At 6 hours a week for 49 active weeks (about 295 hours) plus 3 buffer weeks, the target is: a working mental model of every stage of the modern AI stack (pretraining, post-training, inference, agents, evaluation); the ability to read a new LLM, RL, or generative-modeling paper and locate its weakest claim; cost and scaling arithmetic from first principles; and the habit of auditing an empirical claim before acting on it. This is the knowledge a founder uses when judging a team's plan, a vendor's benchmark, or a technical report. It is roughly a first-year graduate student's reading ability in the LLM-centered part of the field.

Not targeted: research depth in any area, a specialization, implementation ability beyond two toy builds, and calibration against expert reviewers. The two-year plan reached those at twice the hours; this plan does not claim them.

What was cut from the two-year plan, in order of hours saved: the specialization and research investigation (replaced by a 4-week capstone); systems exercises (the Ultra-Scale Playbook and scaling-book problem sets become reading of two chapters); CS285 and most of Sutton and Barto (Prince ch. 19 plus two Sutton and Barto blocks suffice for the RL that post-training needs); generative-model breadth (GANs, flows, score matching dropped; VAE and diffusion kept); interpretability (ARENA dropped); referee-report calibration and replications; three of the eight primer weeks (merged, not dropped). Kept in full: the derivations that bear on judgment, the two toy builds (micrograd and a small GPT), the three-way agent comparison, and the experimental-judgment thread from week 4.

## Depth map

The table is the plan's central decision: which areas are built, which are derived, which are understood at the level of a good lecture, and which are left out. A founder judging claims needs the first three columns at different depths; depth on the fourth is what a researcher needs and you do not.

| Depth | Meaning | Areas |
| --- | --- | --- |
| Built (toy) and derived | You have coded it once and can derive it closed-book | Reverse-mode AD; attention and the transformer block; the training loop |
| Derived, not built | Closed-book derivation; you read, not write, the code | Losses from maximum likelihood; generalization and regularization; the ELBO; MDPs and the policy gradient with baseline; DPO; the GRPO estimator; scaling laws; memory, FLOP, and dollar cost of training and serving |
| Lecture level | One lecture and one paper; you can explain the mechanism and the trade-off, not reproduce it | CNNs and residual networks; diffusion (derivation followed, not reproduced); contrastive and multimodal models; tokenization and decoding strategies; attention alternatives and state-space models; parallelism schemes; FlashAttention; MoE; speculative decoding; PPO; alignment and safety landscape; the practitioner stack (LoRA and QLoRA, quantization formats, serving stacks, model merging, RAG pipeline components, LLM security) |
| Left out | Named so the gap is known | Kernel programming; distributed-training internals; GANs and flows; classical ML beyond a fast pass; deep RL beyond policy gradients; mechanistic interpretability; formal verification; a research contribution |

Three principles survive the cut. Mathematics first, then code, then paper: derive it, see it in the toy, read the original. Every week ends in a closed-book exercise; completing a resource counts for nothing in the ledgers. Experimental judgment, the six questions (contamination, baseline strength, matched budgets, seed variance, judge reliability, construct validity), is applied to every paper from week 4.

## Labonne's LLM Course, mapped in

Your fork of [mlabonne/llm-course](https://github.com/EnchantedBroccoliForest/llm-course) (unmodified, at the February 2026 upstream commit) is an engineer's roadmap: Fundamentals, Scientist, Engineer, plus Colab notebooks. The plan above is a researcher's and judge's. The two overlap on architecture, pretraining, post-training, and evaluation, where this plan already goes deeper; the course adds the practitioner layer this plan lacked, which is what a team of yours would actually do. Added 7 November 2026, at lecture level with one guided run per topic, costing one new week (31) and readings folded into existing weeks.

| Course section | Where it lands | Treatment |
| --- | --- | --- |
| Fundamentals: mathematics | Nowhere | Your degree covers it; the week-1 diagnostic checks |
| Fundamentals: Python, neural networks | Primer P1–P2, Phase 0–1 | Already covered by CS50P, Karpathy, Prince; the course's resources are alternatives, not additions |
| Fundamentals: NLP (embeddings, RNNs) | Week 9, one hour | Alammar's Illustrated Word2Vec and colah's LSTM post, as the history attention replaced |
| Scientist 1: architecture | Weeks 11, 18 | Decoding strategies article; Bycroft's 3D visualization; Karpathy's tokenization video |
| Scientist 2: pre-training | Phase 2 | Already deeper (CS336, FineWeb, DCLM); OLMo 2 noted as an open training codebase |
| Scientist 3: post-training datasets | Week 28 | Chat templates, synthetic data, quality filtering; new to the plan |
| Scientist 4: SFT (LoRA, QLoRA, TRL, Unsloth, Axolotl) | Week 29 | New: LoRA memory arithmetic derived; Unsloth SFT Colab as the guided run |
| Scientist 5: preference alignment | Weeks 29–30, 32 | Already covered by the RLHF book; adds the DPO/IPO/KTO comparison, the DPO logs report, and the HF GRPO exercise as optional |
| Scientist 6: evaluation | Weeks 23, 39 | Adds the HF evaluation guidebook and the harness tools to HELM and Inspect |
| Scientist 7: quantization | Week 31 | New: absmax and zero-point by hand; GGUF quantization as the guided run; GPTQ, AWQ, SmoothQuant at lecture level |
| Scientist 8: new trends | Weeks 31, 33, 36 | Model merging (lecture level); test-time compute post used as a judgment exercise; SAE intuitions as a one-hour read; abliteration skipped |
| Engineer 1: running LLMs | Weeks 31, 37 | APIs and local runners; prompt-engineering guide skimmed; structured outputs |
| Engineer 2–4: vector storage, RAG, advanced RAG | Week 37 | Embedding models and MTEB, chunking, hybrid retrieval, reranking, Ragas metrics, folded into the agent-comparison design; vendor tutorials and database comparisons skipped |
| Engineer 5: agents | Weeks 37–38 | Already covered; adds A2A as a note and names the SDKs for the build week |
| Engineer 6: inference optimization | Weeks 21, 26 | Already covered; adds EAGLE-3 and the HF and Databricks inference posts |
| Engineer 7: deploying | Week 31 | Ollama, LM Studio, vLLM, TGI at lecture level; SageMaker and edge deployment skipped |
| Engineer 8: securing LLMs | Week 39 | New: OWASP LLM Top 10, Prompt Injection Primer, red teaming and garak; a threat model for your own agent |
| Notebooks | Weeks 29–31 | Unsloth SFT and AutoQuant as guided runs; DPO and GRPO Colabs optional; merging and abliteration notebooks skipped |

What the course does not change: the derivations, the toy builds, the judgment thread, or the depth map's "left out" row. Its fine-tuning tooling moves quickly (Unsloth, Axolotl, TRL APIs change between releases); the plan names the tools but the exercises are arithmetic and judgment, which do not.

## CS primer — before week 1 (P1–P5, 30 hours)

You have never taken a CS course; every later week assumes a first-year CS student's knowledge of programming, machine arithmetic, memory, algorithms, and tooling. Five weeks supply exactly that. Compared with the two-year primer, the two memory and arithmetic weeks are merged, algorithms and tooling are merged, and information theory keeps its own week because loss functions are written in its vocabulary.

| Week | Topic | Resource | Exercise, closed-book |
| --- | --- | --- | --- |
| P1 | Programming 1: variables, control flow, functions, strings, lists, dictionaries | [CS50P](https://cs50.harvard.edu/python/) lectures 0–3; Think Python as reference | Five small programs without an agent: prime sieve, word count, a recursive function, a dictionary lookup, a file read |
| P2 | Programming 2 and numerical Python: classes, mutability and references, generators; arrays, shapes, broadcasting | CS50P lectures 4–8 (selected); NumPy quickstart; [From Python to NumPy](https://www.labri.fr/perso/nrougier/from-python-to-numpy/) ch. 1–2 | A Matrix class with operator overloading; matmul three ways (loops, vectorized, `@`), timed, ratio explained |
| P3 | Machine arithmetic and the memory hierarchy: IEEE 754, fp32/bf16/fp16/fp8, cancellation; caches, bandwidth versus latency; what a GPU is | CS:APP sections 2.1–2.4 and 6.1–6.4; Goldberg 1991 sections 1–2; GPU MODE lecture 4 | Why 0.1 + 0.2 ≠ 0.3; derive log-sum-exp; bf16 versus fp16 range and precision; time of a 4096×4096 fp16 matmul from FLOP/s and bandwidth, and which bound binds |
| P4 | Algorithms and tooling: asymptotics, hash tables, graphs, BFS/DFS, topological sort; shell, git, environments, Jupyter, stack traces, HTTP and JSON | Algorithms Illuminated (Roughgarden) Part 1 ch. 1–2 and graph-search chapters; [Missing Semester](https://missing.csail.mit.edu/) lectures 1, 2, 6; MDN, An overview of HTTP | Complexity of attention in sequence length; topologically sort a small computation graph by hand (what autograd does); clone nanochat, make an environment, run its tests, read one stack trace to its cause |
| P5 | Information theory: entropy, cross-entropy, KL, mutual information, source coding | [MacKay](http://www.inference.org.uk/mackay/itila/) ch. 1, 2, 4 | Cross-entropy as expected code length; perplexity as exp(entropy rate); why a tokenizer is a compressor. Gate P: P3 and P5 exercises redone closed-book |

Just-in-time CS later: collective operations (all-reduce, all-gather, reduce-scatter) read before the parallelism week; JSON-RPC reread before the MCP spec.

## Phase 0 — Foundation (weeks 1–4, 24 hours)

Exit condition: backpropagation built once by hand at toy scale; a 500-line PyTorch training script read and explained line by line; FLOP and memory arithmetic for a model done on paper; the six judgment questions in use.

| Weeks | Resource | Do |
| --- | --- | --- |
| 1–2 | Closed-book diagnostic (SVD versus eigendecomposition, conditioning, likelihood versus posterior, a concentration bound, GD versus SGD, prediction versus intervention; derive ridge and cross-entropy gradients; state an MDP and its Bellman equation); [Karpathy, micrograd](https://karpathy.ai/zero-to-hero.html), coded along | micrograd from scratch with a gradient check against finite differences; a one-page derivation of backprop as reverse-mode AD in your own notation. Gaps the diagnostic finds are patched in Phase 1; strengths are waived |
| 3 | PyTorch 60-minute blitz; CS336 lectures on PyTorch and einops, and on GPUs and TPUs | micrograd's MLP rewritten in PyTorch, loss curve matched; roofline for one GPU |
| 4 | Experimental judgment: Kapoor and Narayanan 2023 (leakage); Zheng et al. 2023 (LLM-as-a-judge); one benchmark-contamination analysis | Specify a paired model comparison with an uncertainty estimate; write up one temporal-leakage case from your own quant work; annotate nanochat's training script line by line. Pace review: record measured hours for weeks 1–4. Gate 0 |

Checkpoint artifacts:

- [ ] micrograd with gradient check
- [ ] Backprop-as-reverse-mode-AD derivation, one page
- [ ] nanochat training script annotated

## Phase 1 — Deep learning core (weeks 5–17, 78 hours)

Exit condition: a small GPT coded along once; the ELBO and the policy gradient derived closed-book; CNNs, diffusion, and RL understood at lecture level; a 2017–2022 architecture paper's ablation table predictable before reading it.

Primary text: [Understanding Deep Learning](https://udlbook.github.io/udlbook/) (Prince, MIT Press 2023; free PDF). Chapters 3–12, 14, 17–20 are read; 13, 15, 16 are skipped.

| Weeks | Resource | Do |
| --- | --- | --- |
| 5–7 | Prince ch. 3–9; Adam 2014; Nakkiran 2019 (double descent); Power 2022 (grokking); Dropout 2014 | Derive MSE and cross-entropy from maximum likelihood; Adam's invariance in its precise form (uniform gradient rescaling cancels when epsilon is negligible, nothing more); backprop through a two-layer network; variance-preserving initialization; one page on SGD's implicit regularization |
| 8 | Prince ch. 10–11; ResNet 2015; Batch Normalization 2015 | Run a CIFAR-10 ResNet notebook, vary depth, write up the curves. Lecture level: no build |
| 9–11 | Prince ch. 12; Attention Is All You Need 2017; Karpathy's GPT video, coded along; nanochat's model file side by side; GPT-2 2019; BERT 2018 and ViT 2020 as paper notes | Attention FLOPs and memory as functions of sequence length; causal mask by hand; a toy GPT trained on a small corpus (the second and last toy build); list where nanochat differs (RoPE, RMSNorm, SwiGLU) and why |
| 12–13 | Prince ch. 14, 17, 18; Kingma and Welling 2013; DDPM 2020; CLIP 2021 | Derive the ELBO before reading the derivation; follow the DDPM loss derivation (reading, not closed-book); derive the contrastive objective. A DDPM notebook run is optional |
| 14–15 | Sutton and Barto ch. 1–4 and 13; Prince ch. 19; Spinning Up policy-gradient pages; PPO 2017 as reading | MDP, Bellman equations, policy iteration on a toy MDP by hand; the policy gradient theorem and the baseline variance-reduction argument; map Spinning Up's PPO code to the equations |
| 16 | Prince ch. 20; Kaplan 2020; Chinchilla 2022 | Paper notes; what the power-law fit assumes and where it fails |
| 17 | Gate 1 | Three closed-book derivations: backprop through a transformer block, the ELBO, the policy gradient with baseline. Competency rows 2–6 set |

Canon read in this phase, about fifteen papers: AlexNet, Adam, Batch Normalization, ResNet, Attention Is All You Need, BERT, GPT-2, ViT, DDPM, VAE, Dropout, Layer Normalization, Deep Double Descent, Grokking, Scaling Laws, Chinchilla, CLIP. One paragraph per paper: claim, evidence, weakest point, and which of the six judgment questions it fails.

Checkpoint artifacts:

- [ ] Toy GPT coded along, trained on a small corpus
- [ ] Three closed-book derivations
- [ ] ResNet notebook run with a one-page analysis
- [ ] Fifteen paper notes

## Phase 2 — Language models and systems (weeks 18–27, 60 hours)

Exit condition: you can account on paper for every FLOP, byte, and dollar in a training run described in a technical report, and explain every architecture choice in a current open-weight model.

Spine: [CS336](https://stanford-cs336.github.io/) lectures on tokenization, architectures, attention alternatives, GPUs, parallelism, scaling laws, data, evaluation, and inference (about 20 hours of video); assignment handouts read, none coded. [nanochat](https://github.com/karpathy/nanochat) is the reference implementation, read with the lectures.

| Weeks | Resource | Do |
| --- | --- | --- |
| 18–19 | CS336: tokenization, architectures, attention alternatives; RoPE 2021; Mamba 2023 sections 1–3; LLaMA 1–3 reports, architecture and training sections | BPE merges by hand; parameter count and per-token FLOPs of nanochat's model by hand, checked against the code; KV-cache size as a function of GQA groups and context; reconstruct LLaMA-3 8B training FLOPs and GPU-hours |
| 20–21 | CS336: GPUs, parallelism (overview); [Ultra-Scale Playbook](https://huggingface.co/spaces/nanotron/ultrascale-playbook), parallelism chapter and the appendix on collectives, read only; [How to Scale Your Model](https://jax-ml.github.io/scaling-book), rooflines and inference chapters; FlashAttention 2022 | Memory per GPU under data, tensor, and pipeline parallelism for a 7B model; HBM traffic of standard versus tiled attention and when each bound binds. No exercises beyond these |
| 22 | CS336: scaling laws; Sardana and Frankle 2023 | Fit an IsoFLOP frontier on supplied data; how a lifetime inference budget shifts the optimum |
| 23 | CS336: data, evaluation; FineWeb and DCLM reports; HELM 2022; one contamination study | Which filtering claims have controlled ablations; benchmark critique, first draft |
| 24–25 | Switch Transformer 2021; DeepSeek-V3 report (MLA, MoE); DeepSeek-V4 report | Active versus total parameters; load balancing without auxiliary loss; the V4 training budget reconstructed with reported, derived, and unknown kept separate |
| 26 | CS336: inference; vLLM 2023; speculative decoding (Leviathan 2023) | Expected speedup as a function of acceptance rate; tokens per second per dollar for one open model on one GPU, checked against a published serving benchmark |
| 27 | Gate 2 | Closed-book: memory and FLOP cost of a training step under tensor and data parallelism; a 7B-on-64-GPUs budget by hand. Competency rows 5 and 7 set. Optional nanochat speedrun (\~$75) |

Checkpoint artifacts:

- [ ] nanochat model and tokenizer files annotated
- [ ] Technical-report audit of DeepSeek-V4 with reported, derived, and unknown separated
- [ ] Training-step cost derivation, closed-book
- [ ] Benchmark critique

## Phase 3 — Post-training, practitioner stack, reasoning, agents, evaluation (weeks 28–40, 78 hours)

Exit condition: DPO and the GRPO estimator derived closed-book; Raschka's GRPO notebook run and interpreted; one three-way agent comparison designed, run, written up, and threat-modelled; a system card followed back to its methods; and you can say what a team of yours would do to fine-tune, quantize, serve, and secure a model, and what each choice costs.

| Weeks | Resource | Do |
| --- | --- | --- |
| 28–30 | [Lambert, RLHF](https://rlhfbook.com): definitions and setup, preference data and reward modeling, SFT and rejection sampling, policy gradients (PPO, GRPO), direct alignment; InstructGPT 2022; DPO 2023; Labonne §3–5 (post-training datasets and chat templates; LoRA, QLoRA, and the fine-tuning frameworks; the DPO/IPO/KTO comparison); Raschka, LoRA insights | The KL-regularized objective from memory; Bradley-Terry likelihood; the PPO clipped objective and why it exists; LoRA parameter and memory arithmetic for a 7B model; derive DPO from the KL-regularized optimum plus Bradley-Terry; run the Unsloth SFT Colab as a guided run and read the TRL calls it makes |
| 31 | Practitioner stack: Labonne, Introduction to Weight Quantization; Labonne §7 and Engineer §1, §7 (GGUF and llama.cpp; GPTQ, AWQ, SmoothQuant; Ollama, LM Studio, vLLM, TGI); Merge LLMs with mergekit | Memory of a 7B model at fp16, int8, int4 by hand; quantize a small model to GGUF and measure the perplexity change against bits; one page on the serving stack a team of yours would pick and the cost per million tokens of each option. Lecture level with one guided run; nothing here is derived |
| 32 | CS336: mid- and post-training, RLVR; Tülu 3 report; HF GRPO exercise (optional) | What the RLVR stage changed, from the ablations |
| 33–34 | Raschka, Build a Reasoning Model (From Scratch): evaluation, inference-time scaling, RLVR and GRPO chapters; s1 2025; self-consistency 2022; DeepSeekMath 2024; HF, Scaling test-time compute | Run the evaluation and GRPO notebooks (laptop); expected gain of best-of-n with a verifier as a function of n and verifier error; derive the group-relative advantage estimator; put the HF 3B-beats-70B claim through the six judgment questions |
| 35 | DeepSeek-R1 2025; DAPO 2025; Dr. GRPO 2025; Yue et al. 2025 | One page on zero-variance groups and length bias; a two-page note on whether RLVR adds capability or sharpens sampling |
| 36 | Constitutional AI 2022; sycophancy and reward-hacking papers; one frontier system card followed to its test methods; CLIP, Flamingo, LLaVA as quick reads; Karvonen on SAEs, one hour | System-card note: what it establishes and what it does not |
| 37 | [Berkeley Agentic AI](https://rdi.berkeley.edu/agentic-ai/f25) lectures 1–3 and the evaluation lecture; ReAct 2022; Reflexion 2023; RAG 2020; Labonne Engineer §2–5 (embeddings and MTEB, chunking, hybrid retrieval and reranking, Ragas metrics, structured outputs); Anthropic, Building Effective Agents; MCP spec; A2A as a note | The agent loop as a POMDP, one page; design the three-way comparison: a fixed workflow, a retrieval-assisted workflow, and an agent loop on one bounded knowledge-work task, same model, untouched test set, retrieval and generation failure separated, cost per successful task, abstention policy |
| 38 | Build and run week; Claude Agent SDK, OpenAI Agents SDK, or LangGraph as needed | Assemble with an agent SDK or coding agent; audit splits, metrics, retries; run; Inspect eval; reliability memo with a falsifiable criterion |
| 39 | Judge-reliability literature; prompt injection, untrusted tool output, least privilege; OWASP LLM Top 10; Prompt Injection Primer; red teaming and garak; Agents' Last Exam 2026 | Benchmark critique, final; a page on agent-benchmark construct validity; a threat model for the week-38 agent against the OWASP Top 10 |
| 40 | Gate 3 and oral exam | Closed-book: DPO, the GRPO estimator. One-hour adversarial oral on anything in Phases 0–3. Competency rows 8–11 set |

Checkpoint artifacts:

- [ ] Two closed-book derivations: DPO, GRPO estimator
- [ ] Practitioner artifacts: Unsloth SFT run and GGUF quantization run, each with a half-page of what changed and what it cost; LoRA and quantization memory arithmetic by hand
- [ ] GRPO notebook run with a write-up of the reward curve and pass@k
- [ ] Three-way agent comparison with Inspect eval, reliability memo, and OWASP threat model
- [ ] RLVR-capability note and system-card note

## Capstone (weeks 41–44, 24 hours)

One bounded investigation inside what Phases 1–3 covered, run by an agent to your specification and audited by you, defended orally. The capstone demonstrates method, not a research result. An analytical capstone (a technical-report audit or a cost-and-decision analysis with a small simulation) is equally acceptable and fits a founder's use better than a training run.

| Week | Do |
| --- | --- |
| 41 | Question and falsifier, one page; protocol: unit of analysis, splits, metric, baseline, stopping rule, budget (under $300 or none) |
| 42 | Agent runs the baseline and the experiment; you audit raw outputs and hand-check metric calculations |
| 43 | Write-up, four to six pages: results with uncertainty, alternative explanations, failed tests |
| 44 | Oral defence, one hour, adversarial, with a working researcher if reachable, otherwise with me; delayed retest of three Phase 1–3 derivations; competency ledger finalized; a one-page note on what to study next |

Checkpoint artifacts:

- [ ] Protocol and write-up
- [ ] Audit log of the agent's runs
- [ ] Oral defence completed; retest results recorded

## Keeping current

One paper slot per month for a current primary source, chosen for a reason (new mechanism, strong evidence, important negative result). Sources: Raschka's monthly paper lists and Lambert's Interconnects for selection; technical reports from DeepSeek, Qwen, Moonshot, Mistral, Meta, NVIDIA, Ai2; frontier system cards as released. Skip paper-ranking content sites, leaderboard news without methodology, and anything that reports a claim without the paper. The field's live arguments as of November 2026: continual learning and memory, verifiable rewards beyond math and code, diffusion versus autoregression, and agent-benchmark validity; revised at each quarterly review.

## Checkpoints

| Test | When | Pass condition |
| --- | --- | --- |
| Closed-book derivation | Gates 1, 2, 3 | Six derivations in total, from memory, correct notation: backprop through a transformer block; the ELBO; the policy gradient with baseline; training-step memory and FLOPs under tensor and data parallelism; DPO from the KL-regularized optimum plus Bradley-Terry; the GRPO estimator and its failure cases |
| Paper prediction | Monthly from Phase 2 | Read abstract and method; write the expected ablation table; then read the results. Record the hit rate as a local measure, not a threshold |
| Report audit | Gate 2 | DeepSeek-V4 training budget reconstructed, with every number labelled reported, derived, or unknown |
| Oral exam | Weeks 40 and 44 | One hour, adversarial. The failure mode to watch for is fluent description without being able to say what would differ if the claim were false |
| Delayed retest | Week 44 and 4–6 weeks after any competency level is set | Three derivations redone closed-book; a level drops if the retest fails |

The honest comparison: a first-year PhD student has done one or two courses of this material in more depth and read fewer papers critically; a second-year student has, in addition, a specialization, replications, and a submission. At 295 hours this plan reaches the first-year reading and judgment level across the LLM stack and nothing beyond it. What you will not be able to do: debug a training run, write a kernel, scale a model, review a paper to conference standard, or produce research. What you will be able to do: read any new paper in the area, say what its weakest claim is, reconstruct a lab's training cost from its report, and judge whether a team's experiment answers the question it claims to.

## Progress tracker

Updated whenever you report what you have completed; reviewed in full every quarter, next on Feb 5, 2027. Report in this shape: week; dates; hours; what was done; what you can now derive or explain unaided; where you got stuck. The week-by-week plan and the weekly log: Lesson plan and log

| Milestone | Weeks | Status | Started | Done | Notes |
| --- | --- | --- | --- | --- | --- |
| CS primer | P1–P5 | Not started |  |  | Gate P |
| Phase 0: foundation | 1–4 | Not started |  |  | Pace review at week 4 |
| Phase 1: deep learning core | 5–17 | Not started |  |  | Gate 1 |
| Phase 2: language models and systems | 18–27 | Not started |  |  | Gate 2 |
| Phase 3: post-training, practitioner stack, reasoning, agents | 28–40 | Not started |  |  | Gate 3, oral |
| Capstone | 41–44 | Not started |  |  | Oral defence |

Running counts: papers read in depth 0 · derivations complete 0 of 6 · checkpoint artifacts 0 of 19 · measured hours per week (first four weeks) not yet recorded.

Competency ledger. Levels: U unassessed · 1 can explain with assistance · 2 solves a familiar problem alone · 3 transfers to an unfamiliar case and states the limits · 4 defends an original analysis under critique. A level is set only from a closed-book answer or an audited artifact, never from completing a resource; one competency per phase is retested 4–6 weeks later. The Target column is what this one-year plan aims for; 1 marks the lecture-level areas.

| Competency | Target | Level | Evidence and date | Retest |
| --- | --- | --- | --- | --- |
| Prerequisites: probability, optimization, numerics (diagnostic) | 2 | U unassessed |  |  |
| Reverse-mode AD; reading training code | 2 | U unassessed |  |  |
| Generalization, regularization, and what deep nets do to the classical story | 2 | U unassessed |  |  |
| Deep-network optimization and representations | 2 | U unassessed |  |  |
| Attention, transformers, pretraining and data | 2 | U unassessed |  |  |
| Generative and multimodal objectives and limits | 1 | U unassessed |  |  |
| Compute, memory, scaling, inference economics | 2 | U unassessed |  |  |
| MDPs, policy gradients, RL estimators | 2 | U unassessed |  |  |
| Post-training objectives and reward design | 2 | U unassessed |  |  |
| Reasoning, test-time compute, capability evaluation | 2 | U unassessed |  |  |
| Retrieval, agents, evaluation, safety | 2 | U unassessed |  |  |
| Paper critique and reproducibility audit | 2 | U unassessed |  |  |

Review log, newest first:

| Date | Change |
| --- | --- |
| 7 Nov 2026 | Incorporated the user's fork of Labonne's LLM Course: one new week (31, practitioner stack: quantization, serving, merging) and readings folded into weeks 9, 11, 18, 23, 26, 28–30, 32–33, 36–37, 39 (post-training datasets, LoRA/QLoRA, DPO variants, evaluation tooling, RAG components, LLM security). Phase 3 now weeks 28–40, capstone 41–44; 49 active weeks plus 3 buffer; checkpoint artifacts 19. A mapping table records what was taken, already covered, or skipped |
| 5 Nov 2026 | Condensed to one year at the user's request: 48 active weeks plus 4 buffer, about 290 hours. Cut the specialization and research investigation (replaced by a 4-week capstone), systems exercises, CS285, ARENA, generative-model breadth, referee calibration, replications; merged the primer from 8 weeks to 5. Derivations 8 → 6, checkpoint artifacts 18, competency targets set (level 2, with generative/multimodal at level 1). Two-year plan kept as archive tabs |
| 3 Nov 2026 | Two-year plan: CS primer added; external review's corrections folded in; rescaled to 5–7 hours/week; knowledge-first revision; created. Full log in the archive tab |

## Confidence, competing views, unresolved questions

High confidence: the resources (CS336, Prince, Karpathy, nanochat, the RLHF book, Raschka, the two scaling playbooks, the Berkeley agents course) are the same verified ones as the two-year plan; the sequencing is the one those courses use; six derivations and two toy builds are the irreducible hands-on core for the stated goal.

Medium confidence: that 290 hours reaches first-year graduate reading ability across the whole LLM stack. The inference rests on your mathematics covering a third of the load; the week-1 diagnostic tests that and the week-4 pace review tests the hour estimate. If either fails, the plan compresses Phase 3's agents block before it touches Phases 0–2.

Lower confidence: the five-week primer. Weeks P1–P2 ask a person who has never programmed to be reading research code by week 2 of Phase 0. The two-year plan gave this eight weeks. If P2's exercises are not closed-book clean, add a week there and take it from the capstone.

Competing views worth holding:

1. Go narrower still. A defensible one-year plan for a founder drops the primer's algorithms week, all of generative models, and RL foundations, and spends the 8 weeks on more post-training, agents, and evaluation. The case against: the ELBO, the policy gradient, and generalization are what make the post-training literature readable rather than memorable, and the papers that move the field in 2027 will assume them.
2. Go hands-on instead. The alternative founder plan keeps no derivations and runs more notebooks. The case against: notebooks produce familiarity, derivations produce the ability to tell when a claim cannot be true, which is the skill the plan is for.
3. Skip the capstone. Four weeks is too short for a result and the oral exam at week 40 already tests judgment. The case for keeping it: specifying an experiment and auditing an agent's execution of it is the one practical skill a founder uses weekly, and nothing else in the plan exercises it end to end.

Unresolved, tracked rather than settled: whether RLVR adds capability or sharpens sampling (Yue 2025 versus later exploration work); whether agent benchmarks measure anything that predicts realized value; how much of the open-versus-closed gap in late 2026 is post-training rather than pretraining; and, for this plan specifically, whether a mathematician with no CS can reach reading fluency in research code in seven weeks (P1–P2 plus weeks 1–4), which the week-4 review will answer.
