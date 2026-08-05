-- ============================================================
-- SEED: Hermeneutics Examination — 20 MCQs (objective, auto-graded)
-- Run in Supabase SQL Editor. REPLACES the earlier theory draft of
-- the same title with the multiple-choice version, and PUBLISHES it.
-- ============================================================
DO $$
DECLARE v_course uuid; v_assess uuid;
BEGIN
  SELECT id INTO v_course FROM courses WHERE slug='biblical-hermeneutics' LIMIT 1;
  IF v_course IS NULL THEN RAISE EXCEPTION 'biblical-hermeneutics course not found'; END IF;

  -- Remove any prior assessment of this title (theory draft) + its children
  DELETE FROM assessment_theory   WHERE assessment_id IN (SELECT id FROM assessments WHERE title='Bible Interpretation (Hermeneutics) — Examination');
  DELETE FROM assessment_questions WHERE assessment_id IN (SELECT id FROM assessments WHERE title='Bible Interpretation (Hermeneutics) — Examination');
  DELETE FROM assessments WHERE title='Bible Interpretation (Hermeneutics) — Examination';

  INSERT INTO assessments (course_id, title, instructions, is_published, due_date, obj_marks, theory_marks, total_marks)
  VALUES (v_course, 'Bible Interpretation (Hermeneutics) — Examination', 'This examination covers biblical hermeneutics - the 12 principles of interpretation, key Greek definitions, historical perspectives, and textual analysis from the class syllabus. Choose the best answer for each question.', true, TIMESTAMPTZ '2026-08-09 23:59:00+01', 100, 0, 100)
  RETURNING id INTO v_assess;

  INSERT INTO assessment_questions (assessment_id, question, option_a, option_b, option_c, option_d, correct_option, marks, order_index) VALUES
    (v_assess, 'The word ''hermeneutics'' originates from which Greek god, known as a messenger who interpreted the will of the gods?', 'Heracles', 'Hermes', 'Hephaestus', 'Helios', 'B', 5, 1),
    (v_assess, 'According to 2 Timothy 2:15, what does the Greek word ''orthotomeo'' literally mean?', 'To memorize scripture line by line', 'To translate from Hebrew to Greek', 'To make a straight cut or dissect correctly', 'To pray in tongues before reading', 'C', 5, 2),
    (v_assess, 'According to 2 Peter 1:20, what is stated regarding scripture interpretation?', 'Every believer must create their own doctrine', 'Scripture is reserved only for scholars', 'No prophecy of scripture is of any private interpretation', 'Interpretation changes every decade', 'C', 5, 3),
    (v_assess, 'Which of the following is NOT listed in the syllabus as one of the four dangers leading to wrong Bible interpretation?', 'Studying the Bible like a textbook', 'Using modern Bible translations', 'Misapplying the Word', 'Misrepresenting the Word', 'B', 5, 4),
    (v_assess, 'Which gap between 21st-century readers and the Bible refers specifically to differences in climate, terrain, and country?', 'Historical gap', 'Biological gap', 'Geographical gap', 'Philosophical gap', 'C', 5, 5),
    (v_assess, 'According to the Principle of Context (Rule #1), which of the following is considered the primary rule of Bible interpretation?', 'Interpretations must agree with its context', 'Always assume every word is symbolic', 'Never read the Old Testament', 'Base all doctrines on parables', 'A', 5, 6),
    (v_assess, 'When applying the Principle of Comparison (Rule #2), how should unclear/implicit scriptures be interpreted?', 'By discarding them from the canon', 'In the light of clear and explicit scriptures', 'Through personal dreams and visions only', 'By comparing them with secular literature', 'B', 5, 7),
    (v_assess, 'Which Church Reformer strongly opposed the Medieval Quadriga and advocated that Scripture must be taken literally whenever possible?', 'C.I. Scofield', 'J.N. Darby', 'Martin Luther', 'R.C. Sproul', 'C', 5, 8),
    (v_assess, 'What figure of speech is defined as an obvious, intentional exaggeration not intended to be taken literally (e.g., plank in the eye in Luke 6:42)?', 'Metaphor', 'Simile', 'Hyperbole', 'Personification', 'C', 5, 9),
    (v_assess, 'Which literary genre in the Bible uses narrative and didactic styles to record history and teaching?', 'Poetry', 'Prose', 'Apocalyptic', 'Allegory', 'B', 5, 10),
    (v_assess, 'Believing in the concept of the Triune Godhead even though the exact term ''Trinity'' is not written by name in Scripture is an example of:', 'Negative Hermeneutics', 'The Principle of Theological Concepts (Positive Hermeneutics)', 'Private Interpretation', 'Legalism', 'B', 5, 11),
    (v_assess, 'The Principle of First Mention (Rule #6) states that the first place a subject is mentioned in Scripture serves as:', 'A temporary idea later abolished', 'The anchor or reference point for further interpretation', 'An outdated Old Testament custom', 'A secondary illustration', 'B', 5, 12),
    (v_assess, 'In Charismatic teaching regarding Rule #7 (Double Reference), ''Logos'' refers to the written Word, while ''Rhema'' refers to:', 'Historical fiction', 'The spoken Word by the Holy Spirit to the heart', 'The Greek translation of the Old Testament', 'Preconceived denominational tradition', 'B', 5, 13),
    (v_assess, 'Which early church father stated, ''The new is in the old contained, the old is in the new explained''?', 'Augustine', 'Jerome', 'Eusebius', 'Polycarp', 'A', 5, 14),
    (v_assess, 'The Christo-Centric Principle (Rule #9) teaches that all Scripture revolves around:', 'Church politics and governance', 'Christ and His redemption of mankind', 'The historical biography of David', 'Old Testament ceremonial rituals', 'B', 5, 15),
    (v_assess, 'According to 2 Corinthians 3:6, what does the ''letter'' do versus what the ''spirit'' does?', 'The letter gives life; the spirit kills', 'The letter kills; the spirit gives life', 'Both the letter and spirit condemn', 'The letter heals; the spirit convicts', 'B', 5, 16),
    (v_assess, 'According to Donald Gee''s excerpt on spiritual moves, who is needed to start things moving, and who is needed to keep them moving in the right direction?', 'Scholars to start; skeptics to guide', 'The extremist to start; the balanced teacher to keep moving', 'The congregation to start; pastors to stop it', 'Evangelists to start; apostles to eliminate zeal', 'B', 5, 17),
    (v_assess, 'How many dispensations were introduced by C.I. Scofield in his study Bible system?', '3', '5', '7', '12', 'C', 5, 18),
    (v_assess, 'Under Rule #12 (Principle of Application), how should personal experience be used in relation to Scripture?', 'Experience should determine and form our doctrine', 'Experience is equal in authority to Scripture', 'Experience should be interpreted by Scripture, not Scripture by experience', 'Experience should replace the written Word entirely', 'C', 5, 19),
    (v_assess, 'Which 20th-century revival movement (1906-1912) had as its primary emphasis the ''Restoration of Pentecost in the Church''?', 'Word of Faith Movement', 'Azusa Street Revival', 'Healing Revival', 'Holy Ghost/Joy Movement', 'B', 5, 20);

  RAISE NOTICE 'Published MCQ exam: 20 questions, 100 marks.';
END $$;
