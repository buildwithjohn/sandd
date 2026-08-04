-- ============================================================
-- SEED: Hermeneutics Examination (20 theory questions)
-- Run in Supabase SQL Editor AFTER the app is deployed.
-- Creates one DRAFT assessment on the Biblical Hermeneutics course
-- + 20 theory questions. Review it in Admin -> Assessments, then Publish.
-- Safe to re-run: it won't duplicate (guarded by title).
-- ============================================================

DO $$
DECLARE v_course uuid; v_assess uuid;
BEGIN
  SELECT id INTO v_course FROM courses WHERE slug = 'biblical-hermeneutics' LIMIT 1;
  IF v_course IS NULL THEN RAISE EXCEPTION 'biblical-hermeneutics course not found'; END IF;

  IF EXISTS (SELECT 1 FROM assessments WHERE title = 'Bible Interpretation (Hermeneutics) — Examination') THEN
    RAISE NOTICE 'Assessment already exists — skipping.'; RETURN;
  END IF;

  INSERT INTO assessments (course_id, title, instructions, is_published, obj_marks, theory_marks, total_marks)
  VALUES (v_course, 'Bible Interpretation (Hermeneutics) — Examination', 'This examination evaluates your understanding of biblical hermeneutics, covering the 12 principles of interpretation, key Greek definitions, historical perspectives, and textual analysis from the class syllabus. Answer all 20 questions thoroughly.', false, 0, 100, 100)
  RETURNING id INTO v_assess;

  INSERT INTO assessment_theory (assessment_id, question, marks, order_index) VALUES
    (v_assess, 'Origin and Definition of Hermeneutics: What is the etymological origin of the word ''hermeneutics'', and according to Baker''s Dictionary of Practical Theology, when does something stand in need of interpretation?', 5, 1),
    (v_assess, 'The Meaning of ''Rightly Dividing'': Define the Greek word orthotomeo as used in 2 Timothy 2:15, and explain its literal and figurative implications for reading Scripture.', 5, 2),
    (v_assess, 'Private Interpretation and Heresy: Based on 2 Peter 1:20-21 and 2 Peter 2:1-3, why is private interpretation dangerous, and what motivates false teachers according to Peter?', 5, 3),
    (v_assess, 'The Four Dangers in Bible Interpretation: List the four specific dangers that lead to wrong Bible interpretation as outlined in the syllabus.', 5, 4),
    (v_assess, 'Gaps Hindering Spontaneous Understanding: Name and briefly explain four of the six ''gaps'' standing between 21st-century readers and the original biblical text.', 5, 5),
    (v_assess, 'Rule #1 — The Principle of Context: What are the five main levels of context that must be examined when interpreting any passage of Scripture?', 5, 6),
    (v_assess, 'Rule #2 — Comparing Implicit with Explicit: Explain the Principle of Comparison and differentiate between ''implicit'' and ''explicit'' biblical statements.', 5, 7),
    (v_assess, 'Rule #3 — The Medieval Quadriga vs. Literal Meaning: Describe the Medieval Quadriga''s four-fold method using the example of ''Jerusalem'', and state Martin Luther''s reformational stance on it.', 5, 8),
    (v_assess, 'Figures of Speech in Hermeneutics: Define and give a biblical example for each of the following: (a) Hyperbole, (b) Metaphor, (c) Simile.', 5, 9),
    (v_assess, 'Rule #4 — Grammatico-Historical Method: What is the purpose of the Principle of History and Grammar, and what three basic literary genres are found in the Bible?', 5, 10),
    (v_assess, 'Rule #5 — The Principle of Theological Concepts: Contrast positive hermeneutics with negative hermeneutics, and list three major theological concepts present in Scripture though not mentioned by explicit name.', 5, 11),
    (v_assess, 'Rule #6 — The Principle of First Mention: Why is the first mention of a subject in Scripture critical for correct hermeneutics?', 5, 12),
    (v_assess, 'Rule #7 — The Principle of Double Reference (Logos & Rhema): How does the Principle of Double Reference bridge historical interpretation with modern application? Mention Logos and Rhema.', 5, 13),
    (v_assess, 'Rule #8 — Progressive Revelation: What is the Law of Progressive Revelation, and how does Augustine summarize the relationship between the Old and New Testaments?', 5, 14),
    (v_assess, 'Rule #9 — Scriptural Unity Around Christ: Explain the ''Christo-Centric Principle'' of hermeneutics and how the Gospels compare to the Epistles regarding Christ.', 5, 15),
    (v_assess, 'Rule #10 — Faith and the Holy Spirit: According to 1 Corinthians 2:9-12 and 2 Corinthians 3:6, why must Bible study extend beyond a mere intellectual/scientific exercise?', 5, 16),
    (v_assess, 'Rule #11 — The Principle of Emphasis & Present Truth: What is ''present day truth'' (2 Peter 1:12), and how does Donald Gee describe the balance between ''extremists'' and ''balanced teachers''?', 5, 17),
    (v_assess, 'Dispensational Frameworks: Contrast the 3 widely recognized dispensations with C.I. Scofield''s 7 dispensations.', 5, 18),
    (v_assess, 'Rule #12 — Personal Application & Authority: What relationship should exist between personal experiences and Scripture when forming Christian beliefs?', 5, 19),
    (v_assess, '20th-Century Moves of God: Identify the primary spiritual emphasis for each move: (a) Azusa Street Revival (1906–1912), (b) Word of Faith Movement (1975–1985), (c) Holy Ghost/Joy Movement (1992–present).', 5, 20);

  RAISE NOTICE 'Created draft assessment with 20 theory questions (% marks total).', 100;
END $$;
