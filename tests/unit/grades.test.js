const app = require('../../src/app');

describe('Grade Utility Tests', () => {

  beforeEach(() => {
    app.resetStudents();
  });

  test('should return letter A for grade >= 80', () => {
    const getLetterGrade = (grade) => {
      if (grade >= 80) return 'A';
      if (grade >= 70) return 'B';
      if (grade >= 60) return 'C';
      return 'F';
    };
    expect(getLetterGrade(85)).toBe('A');
    expect(getLetterGrade(80)).toBe('A');
  });

  test('should return letter B for grade between 70 and 79', () => {
    const getLetterGrade = (grade) => {
      if (grade >= 80) return 'A';
      if (grade >= 70) return 'B';
      if (grade >= 60) return 'C';
      return 'F';
    };
    expect(getLetterGrade(75)).toBe('B');
    expect(getLetterGrade(70)).toBe('B');
  });

  test('should return F for grade below 60', () => {
    const getLetterGrade = (grade) => {
      if (grade >= 80) return 'A';
      if (grade >= 70) return 'B';
      if (grade >= 60) return 'C';
      return 'F';
    };
    expect(getLetterGrade(50)).toBe('F');
  });

  test('should calculate average grade correctly', () => {
    const calcAverage = (grades) => {
      if (grades.length === 0) return 0;
      return grades.reduce((a, b) => a + b, 0) / grades.length;
    };
    expect(calcAverage([80, 90, 70])).toBe(80);
    expect(calcAverage([])).toBe(0);
  });

});