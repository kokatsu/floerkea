export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TestCase = {
  id: string;
  title: string;
  priority: Priority;
  description: string;
  preconditions: string[];
  steps: string[];
  expectedResults: string[];
};
