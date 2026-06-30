# CLARITY AI

CLARITY AI is a static hackathon demo for an AI Decision Intelligence Copilot. It turns a CSV into an executive decision center with evidence, recommendations, SQL transparency, Copilot explanations, presentation mode, and a board-ready report export.

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
python3 -m http.server 4181
```

Then open:

```text
http://127.0.0.1:4181/
```

## Deployment

This is a dependency-free static site. Deploy the `clarity-ai-demo` folder to:

- Vercel: import as a static project, output directory `clarity-ai-demo`
- Netlify: drag the folder into Netlify Drop
- GitHub Pages: publish the folder contents from the repository root or `/docs`

No environment variables are required.

## Demo Script

1. Open the landing page.
2. Click `Try Demo Dataset`.
3. Let Decision Replay run.
4. Show the Executive Brief.
5. Open Business Story.
6. Open Evidence and explain the charts.
7. Open Recommendations and click `Explain Recommendation`.
8. Use Copilot quick actions: Explain, Show Evidence, What If, Open SQL.
9. Open SQL Explorer.
10. Click `Download Report`.

## Judge Q&A

- Why is this not just a dashboard? It recommends the decision first, then shows evidence, SQL, charts, and confidence.
- Is the AI hallucinating? No. Recommendations use computed revenue share, momentum, data quality, and confidence values from the loaded dataset.
- Can judges use their own CSV? Yes. Upload validates headers, rows, duplicate columns, numeric metric availability, malformed quotes, and oversized files.
- What is the signature feature? Decision Replay, which narrates the actual analysis path before opening the Decision Center.
- Is it deployable? Yes. It is static, relative-path based, and has no build or environment requirements.

## Known Limitations

- The demo uses client-side analytics only, so very large files should be reduced before upload.
- Report export is a polished HTML report for portability rather than a generated PDF.
