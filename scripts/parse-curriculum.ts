// Parses content/source/Curriculum.md and content/source/Lesson plan and log.md
// (exported from the canonical document) plus the README of the user's fork of
// mlabonne/llm-course, and writes content/curriculum.json and content/PARSE_NOTES.md.
// Also writes a skeleton content/weeks/<id>.md for any week that has no file yet.
// It never touches progress (progress.json or localStorage).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Checkpoint,
  Competency,
  Curriculum,
  Depth,
  Derivation,
  Paper,
  Phase,
  PhaseId,
  Resource,
  Week,
} from "../src/types";
import {
  CURRICULUM_JSON,
  NOTES_MD,
  SOURCE_DIR,
  WEEKS_DIR,
  parseTables,
  readSource,
  rowHash,
  sections,
  slug,
  weekFileName,
  weekSkeleton,
} from "./lib";

const notes: string[] = [];
const note = (s: string) => notes.push(s);

// ---------------------------------------------------------------------------
// Load sources
// ---------------------------------------------------------------------------
const curriculumMd = readSource("Curriculum.md");
const lessonMd = readSource("Lesson plan and log.md");
const readmePath = join(SOURCE_DIR, "llm-course", "README.md");
const readmeMd = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "";
if (!readmeMd) note("llm-course/README.md not found; Labonne links left unresolved.");
const allSourceText = curriculumMd + "\n" + lessonMd + "\n" + readmeMd;

/** A URL may be emitted only if it appears verbatim in one of the source files. */
function sourceUrl(url: string): string | undefined {
  return allSourceText.includes(url) ? url : undefined;
}

const curTables = parseTables(curriculumMd);
const curSections = sections(curriculumMd);
const lessonTables = parseTables(lessonMd);

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------
const totalsM = /At (\d+) hours a week for (\d+) active weeks \(about (\d+) hours\) plus (\d+) buffer weeks/.exec(curriculumMd);
if (!totalsM) throw new Error("Could not find the hours/weeks sentence in Curriculum.md");
const hoursPerWeek = Number(totalsM[1]);
const activeWeeks = Number(totalsM[2]);
const bufferWeeks = Number(totalsM[4]);

// ---------------------------------------------------------------------------
// Phases from Curriculum.md headings
// ---------------------------------------------------------------------------
type PhaseHead = { id: PhaseId; name: string; weeks: [string, string]; hours: number; heading: string };
const phaseHeads: PhaseHead[] = [];
for (const heading of curSections.keys()) {
  let m = /^CS primer.*\((P\d)[–-](P\d), (\d+) hours\)/.exec(heading);
  if (m) phaseHeads.push({ id: "P", name: "CS primer", weeks: [m[1], m[2]], hours: Number(m[3]), heading });
  m = /^Phase (\d) — (.*) \(weeks (\d+)[–-](\d+), (\d+) hours\)/.exec(heading);
  if (m) phaseHeads.push({ id: Number(m[1]) as PhaseId, name: `Phase ${m[1]}: ${m[2]}`, weeks: [m[3], m[4]], hours: Number(m[5]), heading });
  m = /^Capstone \(weeks (\d+)[–-](\d+), (\d+) hours\)/.exec(heading);
  if (m) phaseHeads.push({ id: "C", name: "Capstone", weeks: [m[1], m[2]], hours: Number(m[3]), heading });
}
if (phaseHeads.length !== 6) throw new Error(`Expected 6 phase headings, found ${phaseHeads.length}`);

function exitCondition(ph: PhaseHead): string {
  const body = curSections.get(ph.heading) ?? "";
  const m = /^Exit condition:\s*(.*)$/m.exec(body);
  if (m) return m[1].trim();
  if (ph.id === "P") {
    const gate = /Gate P:[^|]*/.exec(curriculumMd)?.[0].trim();
    note(`Primer has no "Exit condition" paragraph; used the Gate P sentence from the P5 row: "${gate}".`);
    return gate ?? "";
  }
  const first = body.split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("|") && !l.startsWith("-"));
  note(`${ph.name} has no "Exit condition" paragraph; used its first paragraph as the exit condition.`);
  return first ?? "";
}

const checkpoints: Checkpoint[] = [];
const phases: Phase[] = phaseHeads.map((ph) => {
  const body = curSections.get(ph.heading) ?? "";
  const items = [...body.matchAll(/^- \[[ xX]\]\s+(.*)$/gm)].map((m) => m[1].trim());
  const cps: Checkpoint[] = items.map((text, i) => ({ id: `cp-${String(ph.id).toLowerCase()}-${i + 1}`, phase: ph.id, text }));
  checkpoints.push(...cps);
  return { id: ph.id, name: ph.name, weeks: ph.weeks, hours: ph.hours, exitCondition: exitCondition(ph), checkpoints: cps };
});

// ---------------------------------------------------------------------------
// Weeks from Lesson plan tables
// ---------------------------------------------------------------------------
function phaseForHeading(h: string): PhaseId | null {
  if (/^CS primer/.test(h)) return "P";
  const m = /^Phase (\d)/.exec(h);
  if (m) return Number(m[1]) as PhaseId;
  if (/^Capstone/.test(h)) return "C";
  return null;
}

type RawWeek = { id: string; phase: PhaseId; lecture: string; reading: string; exercise: string; hours: number; cells: string[] };
const rawWeeks: RawWeek[] = [];
for (const t of lessonTables) {
  if (t.headers[0] !== "Wk") continue;
  const phase = phaseForHeading(t.heading);
  if (phase === null) continue;
  const col = (name: RegExp) => t.headers.findIndex((h) => name.test(h));
  const cLecture = col(/^(Topic|Lecture or chapter|Work)$/);
  const cReading = col(/^(Resource|Reading)$/);
  const cExercise = col(/^(Exercise, closed-book|Derivation or exercise|Exercise)$/);
  const cHours = col(/^Hrs$/);
  if (cLecture < 0 || cExercise < 0 || cHours < 0) throw new Error(`Unrecognised week table columns under "${t.heading}": ${t.headers.join(" | ")}`);
  for (const cells of t.rows) {
    const id = cells[0].trim();
    if (!/^(P\d|\d+)$/.test(id)) {
      note(`Skipped a row under "${t.heading}" whose week id is "${id}".`);
      continue;
    }
    const clean = (s: string | undefined) => (s ?? "").replace(/^—$/, "").trim();
    rawWeeks.push({
      id,
      phase,
      lecture: clean(cells[cLecture]),
      reading: cReading >= 0 ? clean(cells[cReading]) : "",
      exercise: clean(cells[cExercise]),
      hours: Number(cells[cHours]),
      cells,
    });
  }
}
const primerCount = rawWeeks.filter((w) => w.id.startsWith("P")).length;
if (rawWeeks.length !== 49 || primerCount !== 5) {
  throw new Error(`Expected 49 week rows (5 primer + 44), found ${rawWeeks.length} (${primerCount} primer). Refusing to write output.`);
}
if (rawWeeks.length !== activeWeeks) throw new Error(`Row count ${rawWeeks.length} differs from the stated ${activeWeeks} active weeks.`);
rawWeeks.sort((a, b) => weekOrder(a.id) - weekOrder(b.id));
function weekOrder(id: string): number {
  return id.startsWith("P") ? Number(id.slice(1)) : 100 + Number(id);
}
for (const w of rawWeeks) {
  if (Number.isNaN(w.hours)) throw new Error(`Week ${w.id} has a non-numeric Hrs cell.`);
}
// Phase boundaries must agree between the two files.
for (const ph of phases) {
  const ids = rawWeeks.filter((w) => w.phase === ph.id).map((w) => w.id);
  if (ids[0] !== ph.weeks[0] || ids[ids.length - 1] !== ph.weeks[1]) {
    throw new Error(`Phase ${ph.name}: lesson plan has weeks ${ids[0]}–${ids[ids.length - 1]}, curriculum says ${ph.weeks.join("–")}.`);
  }
}

// ---------------------------------------------------------------------------
// Depth map and depth assignment
// ---------------------------------------------------------------------------
const depthTable = curTables.find((t) => t.heading === "Depth map");
if (!depthTable) throw new Error("Depth map table not found");
const depthKey = (s: string): Depth | "left-out" =>
  /^Built/.test(s) ? "built" : /^Derived/.test(s) ? "derived" : /^Lecture/.test(s) ? "lecture" : "left-out";
const depthMap = depthTable.rows.map((r) => ({ depth: depthKey(r[0]), meaning: r[1], areas: r[2] }));

// Each area of the depth map, with the phrases that identify it in a week row.
// Matching is tried on the lecture column first, then on lecture + exercise.
// One matching depth → that depth. Several or none → "lecture", flagged in PARSE_NOTES.
const areaRules: { depth: Depth; area: string; re: RegExp }[] = [
  { depth: "built", area: "Reverse-mode AD", re: /micrograd|makemore|reverse-mode|Value class|gradient check|backprop(?!.*transformer)/i },
  { depth: "built", area: "attention and the transformer block", re: /\btransformers?\b|Karpathy GPT|toy GPT|causal mask|attention FLOPs|nanochat model file/i },
  { depth: "built", area: "the training loop", re: /training loop|MLP in PyTorch|loss curve matched|PyTorch blitz|PyTorch and einops/i },
  { depth: "derived", area: "losses from maximum likelihood", re: /maximum likelihood|loss functions/i },
  { depth: "derived", area: "generalization and regularization", re: /regularization|fitting, gradients, initialization|why does deep learning work/i },
  { depth: "derived", area: "the ELBO", re: /\bELBO\b|VAEs?/i },
  { depth: "derived", area: "MDPs and the policy gradient with baseline", re: /\bMDP\b|Bellman|policy gradient|Sutton and Barto/i },
  { depth: "derived", area: "DPO", re: /\bDPO\b|direct alignment|KL-regularized|Bradley-Terry|reward modeling/i },
  { depth: "derived", area: "the GRPO estimator", re: /group-relative|GRPO (estimator|chapters)|RLVR and GRPO/i },
  { depth: "derived", area: "scaling laws", re: /scaling laws|IsoFLOP|power-law/i },
  { depth: "derived", area: "memory, FLOP, and dollar cost of training and serving", re: /per-token FLOPs|KV-cache|memory per GPU|HBM traffic|training-step memory|training budget|tokens per second per dollar|memory of a 7B|LoRA parameter count|rooflines? chapter|roofline for one GPU|GPU-hours/i },
  { depth: "lecture", area: "CNNs and residual networks", re: /convolutions|residuals|ResNet/i },
  { depth: "lecture", area: "diffusion", re: /diffusion|DDPM/i },
  { depth: "lecture", area: "contrastive and multimodal models", re: /contrastive|CLIP|multimodal/i },
  { depth: "lecture", area: "tokenization and decoding strategies", re: /tokenization|decoding strategies/i },
  { depth: "lecture", area: "attention alternatives and state-space models", re: /attention alternatives|Mamba|state-space/i },
  { depth: "lecture", area: "parallelism schemes", re: /parallelism/i },
  { depth: "lecture", area: "FlashAttention", re: /FlashAttention/i },
  { depth: "lecture", area: "MoE", re: /\bMoE\b|Switch Transformer|active vs total parameters/i },
  { depth: "lecture", area: "speculative decoding", re: /speculative decoding|CS336: inference/i },
  { depth: "lecture", area: "PPO", re: /\bPPO\b/i },
  { depth: "lecture", area: "alignment and safety landscape", re: /Constitutional AI|system[- ]card|sycophancy|safety|RLVR\b(?! and GRPO)|mid- and post-training/i },
  { depth: "lecture", area: "the practitioner stack", re: /practitioner stack|quantization|serving|LoRA, QLoRA|RAG|agents?\b|agentic|OWASP|security|evaluation, safety|Build and run week|reasoning model|inference-time scaling|evaluation notebook/i },
];

function assignDepth(w: RawWeek): { depth: Depth; areas: string[]; flag?: string } {
  const matchIn = (text: string) => areaRules.filter((r) => r.re.test(text));
  const pick = (hits: typeof areaRules) => {
    const depths = [...new Set(hits.map((h) => h.depth))];
    return { depths, areas: hits.map((h) => h.area) };
  };
  if (w.phase === "P") return { depth: "lecture", areas: [], flag: "CS primer: not covered by the depth map; shown as lecture-level." };
  if (w.phase === "C") return { depth: "lecture", areas: [], flag: "Capstone: not covered by the depth map; shown as lecture-level (method, not a derivation)." };
  if (/Closed-book:/.test(w.exercise)) {
    const hits = matchIn(w.exercise).filter((h) => h.depth !== "lecture");
    return { depth: "derived", areas: hits.map((h) => h.area), flag: "Gate week: closed-book derivations, so derived by the depth map's definition." };
  }
  let r = pick(matchIn(w.lecture || w.reading));
  if (r.depths.length === 1) return { depth: r.depths[0], areas: r.areas };
  r = pick(matchIn(`${w.lecture} ${w.reading} ${w.exercise}`));
  if (r.depths.length === 1) return { depth: r.depths[0], areas: r.areas };
  if (r.depths.length === 0) return { depth: "lecture", areas: [], flag: "No depth-map area matched; defaulted to lecture." };
  return { depth: "lecture", areas: r.areas, flag: `Ambiguous between ${r.depths.join(" and ")} (areas: ${r.areas.join("; ")}); defaulted to lecture.` };
}

// ---------------------------------------------------------------------------
// Resources: name + the URL as it appears in a source file. Each has a regex
// that detects a citation in a week's lecture/reading text.
// ---------------------------------------------------------------------------
type ResourceDef = Resource & { re: RegExp };
const R = (id: string, name: string, kind: Resource["kind"], re: RegExp, url?: string, source?: Resource["source"]): ResourceDef => {
  const resolved = url ? sourceUrl(url) : undefined;
  if (url && !resolved) note(`Resource "${name}": URL ${url} is not in any source file; left unlinked.`);
  return { id, name, kind, re, url: resolved, source: resolved ? source : undefined };
};
const resourceDefs: ResourceDef[] = [
  // Primer
  R("cs50p", "CS50P (Harvard, Introduction to Programming with Python)", "course", /CS50P/, "https://cs50.harvard.edu/python/", "curriculum"),
  R("think-python", "Think Python", "book", /Think Python/),
  R("numpy-quickstart", "NumPy quickstart", "tool", /NumPy quickstart/),
  R("from-python-to-numpy", "From Python to NumPy (Rougier)", "book", /From Python to NumPy/, "https://www.labri.fr/perso/nrougier/from-python-to-numpy/", "curriculum"),
  R("csapp", "CS:APP (Computer Systems: A Programmer's Perspective)", "book", /CS:APP/),
  R("goldberg-1991", "Goldberg 1991, What Every Computer Scientist Should Know About Floating-Point Arithmetic", "paper", /Goldberg 1991/),
  R("gpu-mode", "GPU MODE lectures", "lectures", /GPU MODE/, "https://github.com/gpu-mode/lectures", "lesson-plan"),
  R("roughgarden", "Algorithms Illuminated (Roughgarden), Part 1", "book", /Roughgarden/),
  R("missing-semester", "The Missing Semester of Your CS Education", "course", /Missing Semester/, "https://missing.csail.mit.edu/", "curriculum"),
  R("mdn-http", "MDN, An overview of HTTP", "tool", /MDN/),
  R("mackay", "MacKay, Information Theory, Inference, and Learning Algorithms", "book", /MacKay/, "http://www.inference.org.uk/mackay/itila/", "curriculum"),
  // Spine
  R("karpathy-zero-to-hero", "Karpathy, Neural Networks: Zero to Hero (micrograd, makemore, GPT)", "lectures", /Karpathy (micrograd|GPT)|micrograd|makemore/, "https://karpathy.ai/zero-to-hero.html", "curriculum"),
  R("pytorch-blitz", "PyTorch 60-minute blitz", "tool", /PyTorch blitz/),
  R("cs336", "Stanford CS336, Language Modeling from Scratch", "course", /CS336/, "https://stanford-cs336.github.io/", "curriculum"),
  R("nanochat", "nanochat (Karpathy)", "repo", /nanochat/, "https://github.com/karpathy/nanochat", "curriculum"),
  R("scaling-book", "How to Scale Your Model (the scaling book)", "book", /Scaling book/i, "https://jax-ml.github.io/scaling-book", "curriculum"),
  R("ultra-scale-playbook", "Ultra-Scale Playbook (Hugging Face nanotron)", "book", /Ultra-Scale Playbook/, "https://huggingface.co/spaces/nanotron/ultrascale-playbook", "curriculum"),
  R("prince-udl", "Prince, Understanding Deep Learning", "book", /Prince ch\./, "https://udlbook.github.io/udlbook/", "curriculum"),
  R("sutton-barto", "Sutton and Barto, Reinforcement Learning: An Introduction", "book", /Sutton and Barto/, "http://incompleteideas.net/book/the-book-2nd.html", "lesson-plan"),
  R("spinning-up", "OpenAI Spinning Up in Deep RL", "course", /Spinning Up/, "https://spinningup.openai.com", "lesson-plan"),
  R("rlhf-book", "Lambert, RLHF Book", "book", /RLHF Book/, "https://rlhfbook.com", "lesson-plan"),
  R("raschka-reasoning", "Raschka, Build a Reasoning Model (From Scratch)", "book", /Raschka(?!, LoRA)/),
  R("berkeley-agentic", "Berkeley Agentic AI (CS294, fall 2025)", "course", /Berkeley Agentic AI/, "https://rdi.berkeley.edu/agentic-ai/f25", "curriculum"),
  R("inspect", "Inspect (UK AISI evaluation framework)", "tool", /Inspect eval/, "https://inspect.aisi.org.uk/", "lesson-plan"),
  R("anthropic-agents", "Anthropic, Building Effective Agents", "tool", /Anthropic, Building Effective Agents/),
  R("hf-chat-templating", "Hugging Face chat templating docs", "tool", /HF chat-templating docs|chat templates/, "https://huggingface.co/docs/transformers/main/en/chat_templating", "llm-course"),
  R("hf-llm-course-grpo", "Hugging Face LLM Course ch. 12, Fine-tune with GRPO", "course", /HF LLM Course ch\. 12|HF GRPO exercise/, "https://huggingface.co/learn/llm-course/en/chapter12/5", "llm-course"),
  R("hf-pref-tuning", "Hugging Face, Preference Tuning LLMs (DPO, IPO, KTO)", "tool", /Preference Tuning LLMs/, "https://huggingface.co/blog/pref-tuning", "llm-course"),
  R("dpo-wandb-logs", "DPO W&B logs report (TRL original DPO)", "tool", /DPO W&B logs/, "https://wandb.ai/alexander-vishnevskiy/dpo/reports/TRL-Original-DPO--Vmlldzo1NjI4MTc4", "llm-course"),
  R("hf-eval-guidebook", "Hugging Face LLM evaluation guidebook", "book", /HF LLM Evaluation Guidebook/, "https://huggingface.co/spaces/OpenEvals/evaluation-guidebook", "llm-course"),
  R("lm-eval-harness", "lm-evaluation-harness (EleutherAI)", "tool", /lm-evaluation-harness/, "https://github.com/EleutherAI/lm-evaluation-harness", "llm-course"),
  R("lighteval", "Lighteval (Hugging Face)", "tool", /Lighteval/, "https://github.com/huggingface/lighteval", "llm-course"),
  R("hf-assisted-generation", "Hugging Face, Assisted Generation", "tool", /HF Assisted Generation/, "https://huggingface.co/blog/assisted-generation", "llm-course"),
  R("databricks-inference", "Databricks, LLM inference performance engineering: best practices", "tool", /Databricks LLM inference/, "https://www.databricks.com/blog/llm-inference-performance-engineering-best-practices", "llm-course"),
  R("hf-test-time-compute", "Hugging Face, Scaling test-time compute", "tool", /Scaling test-time compute/, "https://huggingface.co/spaces/HuggingFaceH4/blogpost-scaling-test-time-compute", "llm-course"),
  R("karvonen-saes", "Karvonen, An Intuitive Explanation of Sparse Autoencoders", "tool", /Karvonen/, "https://adamkarvonen.github.io/machine_learning/2024/06/11/sae-intuitions.html", "llm-course"),
  R("owasp-llm-top10", "OWASP Top 10 for LLM Applications", "tool", /OWASP/, "https://owasp.org/www-project-top-10-for-large-language-model-applications/", "llm-course"),
  R("prompt-injection-primer", "Thacker, Prompt Injection Primer (PIPE)", "tool", /Prompt Injection Primer/, "https://github.com/jthack/PIPE", "llm-course"),
  R("ms-red-teaming", "Microsoft, Red teaming LLMs", "tool", /Red teaming LLMs/, "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/red-teaming", "llm-course"),
  R("garak", "garak (LLM vulnerability scanner)", "tool", /garak/, "https://github.com/leondz/garak/", "llm-course"),
  R("mcp-spec", "Model Context Protocol specification", "tool", /MCP spec/, "https://modelcontextprotocol.io/", "llm-course"),
  R("a2a", "Agent2Agent protocol", "tool", /A2A/, "https://a2a-protocol.org/", "llm-course"),
  R("claude-agent-sdk", "Claude Agent SDK", "tool", /Claude Agent SDK/, "https://platform.claude.com/docs/en/agent-sdk/overview", "llm-course"),
  R("openai-agents-sdk", "OpenAI Agents SDK", "tool", /OpenAI Agents SDK/, "https://openai.github.io/openai-agents-python/", "llm-course"),
  R("langgraph", "LangGraph", "tool", /LangGraph/, "https://www.langchain.com/langgraph", "llm-course"),
  // Labonne course articles, notebooks and sections (from the fork's README)
  R("llm-course", "Labonne, LLM Course (your fork)", "course", /Labonne/, "https://github.com/EnchantedBroccoliForest/llm-course", "curriculum"),
  R("labonne-decoding", "Labonne, Decoding Strategies in LLMs", "course", /Decoding Strategies in LLMs/, "https://mlabonne.github.io/blog/posts/2023-06-07-Decoding_strategies.html", "llm-course"),
  R("bycroft-llm-viz", "Bycroft, LLM Visualization", "tool", /Bycroft/, "https://bbycroft.net/llm", "llm-course"),
  R("karpathy-tokenization", "Karpathy, Let's build the GPT Tokenizer (video)", "lectures", /tokenization video/, "https://www.youtube.com/watch?v=zduSFxRajkE", "llm-course"),
  R("alammar-word2vec", "Alammar, The Illustrated Word2vec", "course", /Illustrated Word2Vec/i, "https://jalammar.github.io/illustrated-word2vec/", "llm-course"),
  R("colah-lstm", "colah, Understanding LSTM Networks", "course", /Understanding LSTMs/, "https://colah.github.io/posts/2015-08-Understanding-LSTMs/", "llm-course"),
  R("labonne-unsloth-sft", "Labonne, Fine-tune Llama 3.1 Ultra-Efficiently with Unsloth (article)", "course", /Unsloth SFT Colab|Labonne §4 SFT/, "https://huggingface.co/blog/mlabonne/sft-llama3", "llm-course"),
  R("labonne-unsloth-colab", "Labonne, Fine-tune Llama 3.1 with Unsloth (Colab notebook)", "course", /Unsloth SFT Colab/, "https://colab.research.google.com/drive/164cg_O7SV7G8kZr_JXqLd6VC7pd86-1Z?usp=sharing", "llm-course"),
  R("raschka-lora-insights", "Raschka, LoRA insights", "course", /Raschka, LoRA insights/, "https://lightning.ai/pages/community/lora-insights/", "llm-course"),
  R("labonne-dpo", "Labonne, Fine-tune Mistral-7b with DPO (article)", "course", /Labonne's DPO Colab/, "https://mlabonne.github.io/blog/posts/Fine_tune_Mistral_7b_with_DPO.html", "llm-course"),
  R("labonne-dpo-colab", "Labonne, Fine-tune Mistral-7b with DPO (Colab notebook)", "course", /Labonne's DPO Colab/, "https://colab.research.google.com/drive/15iFBr1xWgztXvhrj5I9fBv20c7CFOPBE?usp=sharing", "llm-course"),
  R("labonne-quantization", "Labonne, Introduction to Weight Quantization", "course", /Introduction to Weight Quantization/, "https://mlabonne.github.io/blog/posts/Introduction_to_Weight_Quantization.html", "llm-course"),
  R("labonne-gguf", "Labonne, Quantize Llama models with llama.cpp (GGUF)", "course", /GGUF and llama\.cpp/, "https://mlabonne.github.io/blog/posts/Quantize_Llama_2_models_using_ggml.html", "llm-course"),
  R("labonne-autoquant", "Labonne, AutoQuant (Colab notebook)", "course", /AutoQuant Colab/, "https://colab.research.google.com/drive/1b6nqC7UZVt8bx4MksX7s656GXPM-eWw4?usp=sharing", "llm-course"),
  R("labonne-gptq", "Labonne, 4-bit LLM Quantization with GPTQ", "course", /GPTQ/, "https://mlabonne.github.io/blog/posts/4_bit_Quantization_with_GPTQ.html", "llm-course"),
  R("awq-article", "Understanding Activation-Aware Weight Quantization (AWQ)", "course", /\bAWQ\b/, "https://medium.com/friendliai/understanding-activation-aware-weight-quantization-awq-boosting-inference-serving-efficiency-in-10bb0faf63a8", "llm-course"),
  R("smoothquant-demo", "SmoothQuant on Llama 2 7B (notebook)", "course", /SmoothQuant/, "https://github.com/mit-han-lab/smoothquant/blob/main/examples/smoothquant_llama_demo.ipynb", "llm-course"),
  R("llama-cpp", "llama.cpp", "repo", /llama\.cpp/, "https://github.com/ggerganov/llama.cpp", "llm-course"),
  R("ollama", "Ollama", "tool", /Ollama/, "https://ollama.ai/", "llm-course"),
  R("lm-studio", "LM Studio", "tool", /LM Studio/, "https://lmstudio.ai/", "llm-course"),
  R("vllm-repo", "vLLM (repository)", "repo", /\bvLLM and TGI\b/, "https://github.com/vllm-project/vllm/tree/main", "llm-course"),
  R("tgi", "Text Generation Inference (TGI)", "repo", /\bTGI\b/, "https://github.com/huggingface/text-generation-inference", "llm-course"),
  R("labonne-mergekit", "Labonne, Merge LLMs with mergekit", "course", /Merge LLMs with mergekit/, "https://mlabonne.github.io/blog/posts/2024-01-08_Merge_LLMs_with_mergekit.html", "llm-course"),
  R("mteb", "MTEB Leaderboard", "tool", /MTEB/, "https://huggingface.co/spaces/mteb/leaderboard", "llm-course"),
  R("ragas-metrics", "Ragas, RAG pipeline metrics", "tool", /Ragas/, "https://docs.ragas.io/en/stable/concepts/metrics/index.html", "llm-course"),
  R("prompting-guide", "Prompt engineering guide", "tool", /prompt engineering guide/, "https://www.promptingguide.ai/", "llm-course"),
  R("outlines", "Outlines (structured outputs)", "tool", /structured outputs/, "https://github.com/outlines-dev/outlines", "llm-course"),
  R("labonne-sec-llm-security", "LLM Security (llmsecurity.net)", "tool", /Labonne §Engineer 8|Engineer §8/, "https://llmsecurity.net/", "llm-course"),
];
const resources: Resource[] = resourceDefs.map(({ re: _re, ...r }) => r);

// ---------------------------------------------------------------------------
// Papers from the Reading column and the canon paragraph
// ---------------------------------------------------------------------------
type PaperDef = Omit<Paper, "weeks"> & { weeks: Set<string> };
const papers = new Map<string, PaperDef>();

// Canon names that are aliases of row entries (same paper, different handle).
const canonAlias: Record<string, string> = {
  "Adam 2014": "Adam",
  "Kingma and Welling 2013": "VAE",
  "Nakkiran 2019": "Deep Double Descent",
  "Power 2022": "Grokking",
  "Kaplan 2020": "Scaling Laws",
};
// Paper URLs that appear in the fork's README (verified below against the source text).
const paperUrls: Record<string, string> = {
  "DPO 2023": "https://arxiv.org/abs/2305.18290",
  "PPO 2017": "https://arxiv.org/abs/1707.06347",
  "DeepSeekMath 2024": "https://arxiv.org/abs/2402.03300",
  "EAGLE-3 2025": "https://arxiv.org/abs/2503.01840",
  "FineWeb report": "https://huggingface.co/spaces/HuggingFaceFW/blogpost-fineweb-v1",
  "CLIP 2021": "https://openai.com/research/clip",
  "LLaVA": "https://llava-vl.github.io/",
};
// Reading segments that name a resource or an unspecified reading rather than a paper.
const notPaper =
  /^(Labonne|HF|CS336|Prince|Sutton|Raschka|Scaling book|Ultra-Scale|Spinning Up|Karpathy|Bycroft|Alammar|colah|Karvonen|Anthropic|MCP|A2A|Thacker|Microsoft|garak|OWASP|Claude|Think Python|NumPy|CS50P|CS:APP|Goldberg|GPU MODE|Roughgarden|Missing Semester|MDN|MacKay|Catch-up|one |Judge-reliability|prompt injection|sycophancy|lm-evaluation|the DPO W&B|RLHF Book|Berkeley|—|$)/i;

function addPaper(rawTitle: string, year: number | undefined, week: string, source: string) {
  const key = year ? `${rawTitle} ${year}` : rawTitle;
  const canon = canonAlias[key];
  const title = canon && canon !== rawTitle ? `${canon} (${rawTitle})` : rawTitle;
  const id = slug(canon ?? rawTitle);
  const existing = papers.get(id);
  if (existing) {
    if (week) existing.weeks.add(week);
    return;
  }
  const url = paperUrls[key] ? sourceUrl(paperUrls[key]) : undefined;
  if (paperUrls[key] && !url) note(`Paper "${title}": URL ${paperUrls[key]} not found in the sources; left unverified.`);
  const p: PaperDef = {
    id,
    title,
    year,
    weeks: new Set(week ? [week] : []),
    url: url ?? `https://arxiv.org/search/?query=${encodeURIComponent(canon ?? rawTitle)}&searchtype=title`,
    urlStatus: url ? "source" : "unverified",
  };
  papers.set(id, p);
  void source;
}

function extractPapers(reading: string, weekId: string) {
  for (let seg of splitTopLevel(reading)) {
    // Strip qualifiers that are not part of the title.
    seg = seg
      .replace(/\s+as (paper )?notes?$/i, "")
      .replace(/\s+as reading$/i, "")
      .replace(/\s+as a note$/i, "")
      .replace(/\s+§\S+$/, "")
      .replace(/,\s*architecture and training sections$/i, "")
      .replace(/\s+\(([^)]*)\)$/g, (m, inner) => (/\b(19|20)\d{2}\b/.test(inner) ? m : ""));
    if (notPaper.test(seg)) {
      if (!/^(Labonne|HF|CS336|Prince|Sutton|Raschka|Scaling book|Ultra-Scale|Spinning Up|Karpathy|Bycroft|Alammar|colah|Karvonen|Anthropic|MCP|A2A|Thacker|Microsoft|garak|OWASP|Claude|Think Python|NumPy|CS50P|CS:APP|Goldberg|GPU MODE|Roughgarden|Missing Semester|MDN|MacKay|Catch-up|Berkeley|RLHF Book|lm-evaluation|the DPO W&B|—|$)/i.test(seg)) {
        note(`Week ${weekId}: reading "${seg}" names no specific paper; not added to the papers register.`);
      }
      continue;
    }
    const paren = /^(.*?)\s*\(([^()]*?)\s((?:19|20)\d{2})\)$/.exec(seg); // "speculative decoding (Leviathan 2023)"
    if (paren) {
      addPaper(`${cap(paren[1])} (${paren[2]})`, Number(paren[3]), weekId, seg);
      continue;
    }
    const whole = /^(.+?)\s((?:19|20)\d{2})$/.exec(seg);
    if (whole && !/\b(19|20)\d{2}\b.*\band\b/.test(seg)) {
      addPaper(whole[1].trim(), Number(whole[2]), weekId, seg);
      continue;
    }
    const parts = seg.split(/\s+and\s+(?=[A-Z])/);
    const yearly = parts.map((p) => /^(.+?)\s((?:19|20)\d{2})$/.exec(p.trim()));
    if (yearly.length > 1 && yearly.every(Boolean)) {
      for (const m of yearly) addPaper(m![1].trim(), Number(m![2]), weekId, seg);
      continue;
    }
    const rep = /^(.*?)\s+(reports?)$/i.exec(seg);
    if (rep) {
      const names = rep[1].split(/\s+and\s+|,\s*/).map((s) => s.trim()).filter(Boolean);
      if (names.length > 1) for (const name of names) addPaper(`${name} report`, undefined, weekId, seg);
      else addPaper(`${rep[1]} ${rep[2]}`, undefined, weekId, seg);
      continue;
    }
    const quick = /^(.*?)\s+quick reads$/i.exec(seg);
    if (quick) {
      for (const name of quick[1].split(/,\s*/).map((s) => s.trim())) addPaper(name === "CLIP" ? "CLIP" : name, name === "CLIP" ? 2021 : undefined, weekId, seg);
      continue;
    }
    note(`Week ${weekId}: reading "${seg}" did not match a paper pattern; not added to the papers register.`);
  }
}
/** Split on ';' outside parentheses. */
function splitTopLevel(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === ";" && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out.filter(Boolean);
}
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Assemble weeks
// ---------------------------------------------------------------------------
const depthNotes: string[] = [];
const weeks: Week[] = rawWeeks.map((w, i) => {
  const gateM = /\bGate (P|\d)\b/.exec(`${w.lecture} ${w.exercise}`);
  const d = assignDepth(w);
  depthNotes.push(`| ${w.id} | ${d.depth} | ${d.areas.join("; ") || "—"} | ${d.flag ?? ""} |`);
  const text = `${w.lecture}; ${w.reading}; ${w.exercise}`;
  const res = resourceDefs.filter((r) => r.re.test(text)).map((r) => r.id);
  extractPapers(w.reading, w.id);
  return {
    id: w.id,
    order: i,
    phase: w.phase,
    lecture: w.lecture,
    reading: w.reading,
    exercise: w.exercise,
    hours: w.hours,
    gate: gateM ? `Gate ${gateM[1]}` : undefined,
    depth: d.depth,
    resources: res,
    papers: [],
    hash: rowHash(w.cells),
  };
});
// CLIP is read both in week 13 (paper) and week 36 (quick read); the canon paragraph adds AlexNet,
// which no row cites. Place AlexNet on the CNN week and flag it.
const canonM = /Canon read in this phase, about fifteen papers:\s*([^.]*)\./.exec(curriculumMd);
if (canonM) {
  const names = canonM[1].split(/,\s*/).map((s) => s.trim());
  const known = new Set([...papers.values()].map((p) => p.id));
  for (const name of names) {
    const id = slug(name);
    if (known.has(id)) continue;
    const aliasHit = [...papers.values()].find((p) => p.title.startsWith(`${name} (`));
    if (aliasHit) continue;
    if (name === "AlexNet") {
      addPaper("AlexNet", undefined, "8", "canon");
      note(`Paper "AlexNet" comes from the Phase 1 canon paragraph only; no week row cites it. Placed on week 8 (CNNs and residual networks) by topic.`);
    } else {
      addPaper(name, undefined, "", "canon");
      note(`Canon paper "${name}" is not cited by any week row; registered without a week.`);
    }
  }
}
for (const w of weeks) w.papers = [...papers.values()].filter((p) => p.weeks.has(w.id)).map((p) => p.id);

// ---------------------------------------------------------------------------
// Derivations from the Checkpoints table
// ---------------------------------------------------------------------------
const cpTable = curTables.find((t) => t.heading === "Checkpoints" && t.headers[0] === "Test");
if (!cpTable) throw new Error("Checkpoints table not found");
const derRow = cpTable.rows.find((r) => /^Closed-book derivation/.test(r[0]));
if (!derRow) throw new Error("Closed-book derivation row not found");
const derTitles = derRow[2].split(":").slice(1).join(":").split(";").map((s) => s.trim()).filter(Boolean);
if (derTitles.length !== 6) throw new Error(`Expected 6 derivations, found ${derTitles.length}`);
// Due week: the gate week whose closed-book exercise names the derivation.
const derKeys: RegExp[] = [/transformer block/i, /\bELBO\b/i, /policy gradient/i, /tensor and data parallelism/i, /\bDPO\b/, /\bGRPO\b/];
const gateWeeks = weeks.filter((w) => /Closed-book:/.test(w.exercise));
const derivations: Derivation[] = derTitles.map((title, i) => {
  const due = gateWeeks.find((w) => derKeys[i].test(w.exercise));
  if (!due) throw new Error(`No gate week found for derivation "${title}"`);
  return { id: `der-${i + 1}-${slug(title).split("-").slice(0, 4).join("-")}`, title: cap(title), phase: due.phase, weekDue: due.id };
});

// ---------------------------------------------------------------------------
// Competencies
// ---------------------------------------------------------------------------
const compTable = curTables.find((t) => t.headers[0] === "Competency");
if (!compTable) throw new Error("Competency ledger table not found");
if (compTable.rows.length !== 12) throw new Error(`Expected 12 competencies, found ${compTable.rows.length}`);
// "Competency rows N–M set" in gate weeks gives the phase in which each row is first set.
const rowPhase = new Map<number, PhaseId>();
for (const w of weeks) {
  for (const m of w.exercise.matchAll(/Competency rows? (\d+)(?:[–-](\d+))?(?: and (\d+))? set/g)) {
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let r = a; r <= b; r++) if (!rowPhase.has(r)) rowPhase.set(r, w.phase);
    if (m[3] && !rowPhase.has(Number(m[3]))) rowPhase.set(Number(m[3]), w.phase);
    else if (m[3]) note(`Competency row ${m[3]} is set again in week ${w.id}; phaseSet keeps its first phase.`);
  }
}
const competencies: Competency[] = compTable.rows.map((r, i) => {
  const row = i + 1;
  let phaseSet = rowPhase.get(row);
  if (!phaseSet) {
    if (row === 1) { phaseSet = 0; note(`Competency row 1 (prerequisites diagnostic) has no "rows set" gate; assigned to Phase 0 (week-1 diagnostic).`); }
    else if (row === 12) { phaseSet = "C"; note(`Competency row 12 (paper critique) has no "rows set" gate; assigned to the Capstone (ledger finalized in week 44).`); }
    else { phaseSet = "C"; note(`Competency row ${row} has no "rows set" gate; assigned to the Capstone.`); }
  }
  const target = Number(r[1]);
  if (target !== 1 && target !== 2) throw new Error(`Competency row ${row} target "${r[1]}" is not 1 or 2`);
  return { id: `comp-${row}`, name: r[0], phaseSet, target: target as 1 | 2 };
});

// ---------------------------------------------------------------------------
// Review log, milestones, judgment questions, level scale
// ---------------------------------------------------------------------------
const reviewTable = curTables.find((t) => t.headers[0] === "Date" && t.headers[1] === "Change");
const reviews = (reviewTable?.rows ?? []).map((r) => ({ date: r[0], change: r[1] }));
const msTable = curTables.find((t) => t.headers[0] === "Milestone");
const milestones = (msTable?.rows ?? []).map((r) => ({ name: r[0], weeks: r[1], notes: r[5] ?? "" }));
const jqM = /the six questions \(([^)]*)\)/.exec(curriculumMd);
const judgmentQuestions = jqM ? jqM[1].split(/,\s*/).map((s) => s.trim()) : [];
if (judgmentQuestions.length !== 6) throw new Error("Could not find the six judgment questions");
const levelsM = /Levels:\s*(.*?)\.\s*A level is set/.exec(curriculumMd);
const levelScale: Record<string, string> = {};
if (levelsM) for (const part of levelsM[1].split("·").map((s) => s.trim())) {
  const m = /^(U|\d)\s+(.*)$/.exec(part);
  if (m) levelScale[m[1]] = m[2];
}
const ruleM = /(A level is set only from[^.]*\.)/.exec(curriculumMd);
const competencyRule = ruleM ? ruleM[1] : "A level is set only from unaided work, never from completing a resource.";

const canonicalUrl = sourceUrl("https://claude.ai/artifact/CCMEm7SGP12f3az3UcNZXF") ?? "";
const curriculum: Curriculum = {
  generatedFrom: { curriculum: "content/source/Curriculum.md", lessonPlan: "content/source/Lesson plan and log.md" },
  title: curriculumMd.split("\n")[0].replace(/^#\s*/, ""),
  canonicalUrl,
  totals: { activeWeeks, bufferWeeks, hoursPerWeek, plannedHours: weeks.reduce((s, w) => s + w.hours, 0) },
  depthMap,
  judgmentQuestions,
  levelScale,
  competencyRule,
  phases,
  weeks,
  checkpoints,
  derivations,
  competencies,
  papers: [...papers.values()].map((p) => ({ ...p, weeks: [...p.weeks].sort((a, b) => weekOrder(a) - weekOrder(b)) })),
  resources,
  reviews,
  milestones,
};

// ---------------------------------------------------------------------------
// Write outputs
// ---------------------------------------------------------------------------
writeFileSync(CURRICULUM_JSON, JSON.stringify(curriculum, null, 2) + "\n");

const unlinked = resources.filter((r) => !r.url).map((r) => r.name);
const unverified = curriculum.papers.filter((p) => p.urlStatus !== "source").length;
const notesMd = `# Parse notes

Generated by \`pnpm parse\` on ${new Date().toISOString().slice(0, 10)}. Anything ambiguous or unverified in the
conversion from the two exported source files to \`content/curriculum.json\` is listed here.

## Counts

| Item | Count |
| --- | --- |
| Weeks | ${weeks.length} (${primerCount} primer + ${weeks.length - primerCount}) |
| Phases | ${phases.length} |
| Checkpoint artifacts | ${checkpoints.length} |
| Derivations | ${derivations.length} |
| Competencies | ${competencies.length} |
| Papers | ${curriculum.papers.length} (${unverified} without a URL in the sources, linked to an arXiv title search) |
| Resources | ${resources.length} (${unlinked.length} without a URL in the sources) |

## Depth assignment

Depth is assigned by matching each week's row to an area of the depth map. The lecture column is tried
first (the reading column when the lecture column is empty); if it matches areas of exactly one depth that
depth is used, otherwise lecture + reading + exercise are tried. Several depths or none → \`lecture\`, flagged
below. Gate weeks are closed-book derivations and so count as derived. Primer and capstone weeks are outside
the depth map.

| Week | Depth | Matched areas | Flag |
| --- | --- | --- | --- |
${depthNotes.join("\n")}

## Resources without a URL in the sources

${unlinked.map((n) => `- ${n}`).join("\n") || "- none"}

## Papers

Paper titles are taken from the Reading column as written (handle plus year). Where the Phase 1 canon
paragraph names the same paper by another handle, the canon name is shown first. No arXiv ID, DOI, venue
or publication date has been added. Papers whose URL is not in the sources link to an arXiv title search.

${curriculum.papers.map((p) => `- ${p.title}${p.year ? ` (${p.year})` : ""} — weeks ${p.weeks.join(", ") || "none"} — ${p.urlStatus}`).join("\n")}

## Other notes

${[...new Set(notes)].map((n) => `- ${n}`).join("\n") || "- none"}
`;
writeFileSync(NOTES_MD, notesMd);

mkdirSync(WEEKS_DIR, { recursive: true });
let skeletons = 0;
for (const w of weeks) {
  const p = join(WEEKS_DIR, weekFileName(w.id));
  if (!existsSync(p)) {
    writeFileSync(p, weekSkeleton(w, curriculum));
    skeletons++;
  }
}

console.log(
  `Parsed ${weeks.length} weeks, ${phases.length} phases, ${checkpoints.length} checkpoints, ${derivations.length} derivations, ` +
    `${competencies.length} competencies, ${curriculum.papers.length} papers, ${resources.length} resources. ` +
    `Wrote content/curriculum.json, content/PARSE_NOTES.md, ${skeletons} new week skeleton(s).`,
);
