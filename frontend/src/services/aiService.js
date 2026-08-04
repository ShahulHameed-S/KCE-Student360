import api from "./api";
import { mockStudents } from "../data/mockStudents";

export const aiService = {
  generateAiSummary: async (registerNo) => {
    try {
      const response = await api.post("/ai/generate-summary", { register_no: registerNo }, { timeout: 120000 });
      return response.data;
    } catch (error) {
      console.warn(`AI Generate Summary API failed for student ${registerNo}. Generating mock summary:`, error.message);
      
      // Simulate AI latency
      await new Promise(resolve => setTimeout(resolve, 1500));

      const student = mockStudents.find(s => s.register_no === registerNo);
      if (!student) {
        return {
          summary: "Student profile not found. Unable to analyze statistics.",
          strengths: [],
          weaknesses: [],
          suggestions: [],
          placement_advice: ""
        };
      }

      const strongest = student.strongest_domain;
      const weakest = student.weakest_domain;
      const sScore = student.domain_scores[strongest];
      const wScore = student.domain_scores[weakest];

      // Custom profiles
      return {
        summary: `${student.name} is a highly dedicated student in the ${student.department} department. With an overall average score of ${student.overall_score}%, they demonstrate solid fundamental knowledge. They are exceptionally strong in ${strongest} with an assessment average of ${sScore}%, indicating a high degree of core problem-solving aptitude.`,
        strengths: [
          `Top performer in ${strongest} (${sScore}%), demonstrating advanced comprehension.`,
          student.projects.length > 0 
            ? `Successfully designed and deployed practical applications: ${student.projects.map(p => p.title).join(", ")}.`
            : `Maintains a clean and consistent assessment submission rate.`,
          student.certifications.length > 0
            ? `Earned verified credentials including: ${student.certifications.map(c => c.title).join(", ")}.`
            : `Exhibits strong foundational competencies.`
        ],
        weaknesses: [
          `Relatively lower proficiency in ${weakest} (${wScore}%), which could impact core placement tests.`,
          student.projects.length === 0 ? "Needs more hands-on project implementations to reinforce theoretical learning." : "Needs to write more tests and document software architectures."
        ],
        suggestions: [
          `Focus on strengthening ${weakest} core concepts. Practice daily coding puzzles related to this area.`,
          `Create 1-2 new micro-services/projects emphasizing database schemas and cloud scaling.`,
          `Take mock quizzes to improve competitive aptitude speeds.`
        ],
        placement_advice: `With a strong background in ${strongest}, ${student.name} is well-suited for roles such as Software Development Engineer (SDE) or Frontend/FullStack Developer. To pass tier-1 company rounds, they must revise ${weakest} concepts and participate in weekly mock coding rounds. Focus on explaining project architectures clearly in interviews.`
      };
    }
  }
};
