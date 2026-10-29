
import { useRef, useState } from "react";


function SkillList({ title, skills, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-zinc-700">
        {title}
      </h4>

      {skills?.length ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className={`rounded-full px-3 py-1 text-xs font-medium ${colors[color]}`}
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">None identified</p>
      )}
    </div>
  );
}


function App() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeId, setResumeId] = useState(null);

  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchError, setMatchError] = useState("");

  const selectFile = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const isDocx =
      selectedFile.name.toLowerCase().endsWith(".docx") &&
      selectedFile.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const isPdf =
      selectedFile.name.toLowerCase().endsWith(".pdf") &&
      selectedFile.type === "application/pdf";

    if (!validTypes.includes(selectedFile.type) || !(isPdf || isDocx)) {
      alert("Please select a PDF or DOCX file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("Your resume must be 5 MB or smaller.");
      return;
    }

    setFile(selectedFile);
  };



  const handleUpload = async () => {
    if (!file || uploading || analyzing) return;

    setUploading(true);
    setError("");
    setAnalysis(null);

    try {
      // Step 1: Upload the resume
      const formData = new FormData();
      formData.append("resume", file);

      const uploadResponse = await fetch(
        "http://localhost:4000/api/resumes/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.message || "Resume upload failed.");
      }

      const id = uploadResult.data._id || uploadResult.data.id;
      if (!id) throw new Error("Upload succeeded, but no resume ID was returned.");

      setResumeId(id);
      setUploading(false);
      setAnalyzing(true);

      // Step 2: Run AI analysis
      const analysisResponse = await fetch(
        `http://localhost:4000/api/resumes/${id}/analyze`,
        { method: "POST" }
      );

      const analysisResult = await analysisResponse.json();

      if (!analysisResponse.ok || !analysisResult.success) {
        throw new Error(analysisResult.message || "Resume analysis failed.");
      }

      // Handle either { data: { analysis: ... } } or { data: ... }
      const resultData = analysisResult.data;
      const parsedAnalysis = resultData.analysis ?? resultData;

      setAnalysis(parsedAnalysis);
      await fetchJobMatches(id);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const fetchJobMatches = async (id) => {
    setLoadingMatches(true);
    setMatchError("");
    setMatches([]);

    try {
      const response = await fetch(
        `http://localhost:4000/api/resumes/${id}/matches`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch job matches.");
      }

      setMatches(result.data.matches ?? []);
    } catch (err) {
      setMatchError(err.message || "Could not load job matches.");
    } finally {
      setLoadingMatches(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      <header className="border-b border-zinc-200">
        <nav className="mx-auto flex max-w-7xl items-center gap-5 px-6 py-5">
          <a href="/" className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight">
              Resume<span className="text-blue-600">IQ</span>
            </span>
          </a>


          <span className="hidden text-base font-medium leading-relaxed tracking-wide text-zinc-600 sm:block">
            AI-powered resume analysis & job matching
          </span>

        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-14 px-6 py-8 md:grid-cols-2 md:py-12">
        <section>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Your next opportunity starts here
          </div>

          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Your resume deserves a{" "}
            <span className="text-blue-600">better match.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-600">
            Discover your strengths, uncover skill gaps, and find job
            opportunities that align with your experience—all in one place.
          </p>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-zinc-600">
            <span className="flex items-center gap-2">
              <span className="text-blue-600">✓</span> AI resume analysis
            </span>
            <span className="flex items-center gap-2">
              <span className="text-blue-600">✓</span> Skill gap detection
            </span>
            <span className="flex items-center gap-2">
              <span className="text-blue-600">✓</span> Ranked job matches
            </span>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/60 sm:p-9">
          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight">
              Analyze your resume
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Upload your resume to get started. We'll take care of the rest.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              selectFile(event.dataTransfer.files[0]);
            }}
            className={`flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${dragging
              ? "border-blue-500 bg-blue-50"
              : "border-zinc-300 bg-zinc-50 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-700">
              ↑
            </div>

            {file ? (
              <>
                <p className="mt-5 max-w-full break-all font-semibold">
                  {file.name}
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 font-semibold">
                  Drop your resume here
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  or click to browse your files
                </p>
              </>
            )}

            <span className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200">
              {file ? "Choose another file" : "Browse files"}
            </span>

            <p className="mt-4 text-xs text-zinc-400">
              PDF or DOCX · Maximum file size 5 MB
            </p>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(event) => {
              selectFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />


          <button
            type="button"
            disabled={!file || uploading}
            onClick={handleUpload}
            className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {uploading
              ? "Uploading resume..."
              : analyzing
                ? "Analyzing resume..."
                : analysis
                  ? "Analyze another resume →"
                  : "Analyze my resume →"}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <p className="mt-4 text-center text-xs leading-5 text-zinc-400">
            Your resume is processed by your application's backend.
          </p>
        </section>

        {(loadingMatches || matchError || matches.length > 0 || analysis) && (
          <section className="col-span-full mx-auto mt-12 w-full max-w-5xl">
            <div className="mb-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Career opportunities
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Jobs matched to your resume
              </h2>
              <p className="mt-2 text-zinc-500">
                Compare your skills with the requirements of available roles.
              </p>
            </div>

            {loadingMatches && (
              <div className="rounded-2xl border border-zinc-200 p-8 text-center">
                <p className="font-medium">Finding your best matches...</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Comparing your resume against available jobs.
                </p>
              </div>
            )}

            {matchError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {matchError}
              </div>
            )}

            {!loadingMatches && !matchError && matches.length === 0 && analysis && (
              <div className="rounded-2xl border border-zinc-200 p-8 text-center">
                <p className="font-semibold">No job matches found</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Add job listings to your database and analyze your resume again.
                </p>
              </div>
            )}

            {!loadingMatches && matches.length > 0 && (
              <div className="space-y-5">
                <p className="text-sm text-zinc-500">
                  Showing {matches.length} best matches
                </p>

                {matches.map((item) => {
                  const match = item.match;
                  const score = match.score;
                  const scoreColor =
                    score >= 80
                      ? "text-emerald-700 bg-emerald-50"
                      : score >= 50
                        ? "text-amber-700 bg-amber-50"
                        : "text-red-700 bg-red-50";

                  return (
                    <article
                      key={item.jobId}
                      className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-lg hover:shadow-zinc-200/40 sm:p-7"
                    >
                      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div>
                          <h3 className="text-xl font-bold">{item.title}</h3>
                          <p className="mt-1 font-medium text-zinc-600">
                            {item.company}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                            <span className="rounded-full bg-zinc-100 px-3 py-1.5">
                              {item.location || "Location unspecified"}
                            </span>
                            <span className="rounded-full bg-zinc-100 px-3 py-1.5">
                              {item.experienceLevel || "Experience unspecified"}
                            </span>
                          </div>
                        </div>

                        <div className={`flex shrink-0 flex-col items-center rounded-2xl px-5 py-3 ${scoreColor}`}>
                          <span className="text-3xl font-bold">
                            {score == null ? "N/A" : `${score}%`}
                          </span>
                          <span className="mt-1 text-xs font-medium">
                            Skill match
                          </span>
                        </div>
                      </div>

                      <p className="mt-5 text-sm leading-6 text-zinc-600">
                        {match.explanation}
                      </p>

                      <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <SkillList
                          title={`Matched required skills (${match.totalMatchedSkills}/${match.totalRequiredSkills})`}
                          skills={match.matchedSkills}
                          color="green"
                        />

                        <SkillList
                          title="Missing required skills"
                          skills={match.missingSkills}
                          color="red"
                        />

                        <SkillList
                          title="Matched preferred skills"
                          skills={match.preferredMatchedSkills}
                          color="blue"
                        />

                        <SkillList
                          title="Missing preferred skills"
                          skills={match.preferredMissingSkills}
                          color="amber"
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </main>


      {analyzing && (
        <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-blue-800">
          <p className="font-semibold">Analyzing your resume with AI...</p>
          <p className="mt-2 text-sm">
            Extracting skills, experience, education, and projects. This may take a little while.
          </p>
        </div>
      )}

      {analysis && (
        <section className="col-span-full mx-auto mt-10 w-full max-w-5xl space-y-6">
          <div>
            <p className="text-sm font-medium text-blue-600">Analysis complete</p>
            <h2 className="mt-1 text-3xl font-bold">Your resume insights</h2>
            <p className="mt-3 leading-7 text-zinc-600">{analysis.summary}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 p-6">
              <h3 className="text-lg font-semibold">Technical skills</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {(analysis.skills ?? []).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-6">
              <h3 className="text-lg font-semibold">Strengths</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
                {(analysis.strengths ?? []).map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-lg font-semibold">Experience</h3>
            <div className="mt-4 space-y-4">
              {(analysis.experience ?? []).map((item, index) => (
                <div key={`${item.role}-${index}`}>
                  <p className="font-medium">{item.role}</p>
                  <p className="text-sm text-zinc-500">
                    {[item.company, item.duration].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 p-6">
              <h3 className="text-lg font-semibold">Education</h3>
              <div className="mt-4 space-y-3">
                {(analysis.education ?? []).map((item, index) => (
                  <div key={`${item.degree}-${index}`}>
                    <p className="font-medium">{item.degree}</p>
                    <p className="text-sm text-zinc-500">
                      {[item.institution, item.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-6">
              <h3 className="text-lg font-semibold">Suggestions</h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-600">
                {(analysis.suggestions ?? []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}



      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-2">
          <p className="text-[10px] leading-4 text-zinc-400">
            © 2026 ResumeIQ
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
