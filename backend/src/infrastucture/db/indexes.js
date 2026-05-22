import Test from "../../models/test.model.js";
import Question from "../../models/question.model.js";
import TestAttempt from "../../models/testAttempt.model.js";
import TestSeriesTopic from "../../models/testSeriesTopic.model.js";
import TestSeriesSubject from "../../models/testSeriesSubject.model.js";
import TestSeriesChapter from "../../models/testSeriesChapter.model.js";
import ExamCategory from "../../models/examCategory.model.js";
import Exam from "../../models/exam.model.js";
import AllIndiaTestSeries from "../../models/allIndiaTestSeries.model.js";

export const createIndexes = async () => {
  try {
    // Test indexes
    await Test.collection.createIndex({ teacherId: 1, createdAt: -1 });
    await Test.collection.createIndex({ status: 1 });
    await Test.collection.createIndex({ topicId: 1, subjectId: 1, chapterId: 1, createdAt: -1 });
    await Test.collection.createIndex({ aitsId: 1, createdAt: -1 });
    await Test.collection.createIndex({ type: 1 });

    // Test series indexes
    await TestSeriesTopic.collection.createIndex({ teacherId: 1, createdAt: -1 });
    await TestSeriesTopic.collection.createIndex({ examId: 1, createdAt: -1 });
    await TestSeriesSubject.collection.createIndex({ teacherId: 1, topicId: 1, createdAt: 1 });
    await TestSeriesChapter.collection.createIndex({ teacherId: 1, subjectId: 1, createdAt: 1 });

    // Exam category + exam indexes
    await ExamCategory.collection.createIndex({ slug: 1 }, { unique: true });
    await ExamCategory.collection.createIndex({ order: 1 });
    await Exam.collection.createIndex({ slug: 1 }, { unique: true });
    await Exam.collection.createIndex({ examCategoryId: 1, order: 1 });

    // AITS indexes
    await AllIndiaTestSeries.collection.createIndex({ examId: 1, order: 1 });
    await AllIndiaTestSeries.collection.createIndex({ teacherId: 1 });

    // Question indexes
    await Question.collection.createIndex({ testId: 1, createdAt: 1 });
    await Question.collection.createIndex({ createdBy: 1 });
    await Question.collection.createIndex({ difficulty: 1 });

    // Test Attempt indexes
    await TestAttempt.collection.createIndex({ testId: 1, studentId: 1 });
    await TestAttempt.collection.createIndex({ testId: 1, status: 1 });
    await TestAttempt.collection.createIndex({ studentId: 1, status: 1 });
    await TestAttempt.collection.createIndex({ 
      testId: 1, 
      marksObtained: -1, 
      timeTaken: 1 
    });

    console.log("✓ Database indexes created successfully");
  } catch (error) {
    console.error("✗ Error creating indexes:", error.message);
  }
};
