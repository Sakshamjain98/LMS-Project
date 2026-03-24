import Test from "../../models/test.model.js";
import Question from "../../models/question.model.js";
import TestAttempt from "../../models/testAttempt.model.js";

export const createIndexes = async () => {
  try {
    // Test indexes
    await Test.collection.createIndex({ teacherId: 1, createdAt: -1 });
    await Test.collection.createIndex({ status: 1 });

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
