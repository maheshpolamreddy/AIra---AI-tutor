import { TeachingStep } from '../types';
// import { ecgBasicsSteps } from './courses/ecgBasics';
// import { heartStructureSteps } from './courses/heartStructure';
// import { valvesSteps } from './courses/valves';
// import { bloodFlowSteps } from './courses/bloodFlow';
// import { brainStructureSteps } from './courses/brainStructure';
// import { neuronsSteps } from './courses/neurons';
// import { reactBasicsSteps } from './courses/reactBasics';
// import { stateManagementSteps } from './courses/stateManagement';
// import { sortingSteps } from './courses/sorting';
// import { newtonsLawsSteps } from './courses/newtonsLaws';
// import { dnaStructureSteps } from './courses/dnaStructure';
// import { seoSteps } from './courses/seo';
// import { stocksSteps } from './courses/stocks';
// import { supervisedSteps } from './courses/supervised';
// import { encryptionSteps } from './courses/encryption';
// import { kinematicsSteps } from './courses/kinematics';
// import { hereditySteps } from './courses/heredity';
// import { contractFormationSteps } from './courses/contractFormation';
// import { activeLearningSteps } from './courses/activeLearning';
// import { anxietySteps } from './courses/anxiety';
// import { coronaryArteriesSteps } from './courses/coronaryArteries';
// import { spinalCordSteps } from './courses/spinalCord';
// import { graphsSteps } from './courses/graphs';
// import { apiDesignSteps } from './courses/apiDesign';
// import { sqlBasicsSteps } from './courses/sqlBasics';
import { defaultSteps } from './courses/defaultCourse';
import { mitochondriaGrade11Steps } from './courses/mitochondriaGrade11';
import {
    biology11CellMembraneSteps,
    biology11ChloroplastSteps,
    biology11ProkaryoticCellSteps,
} from './courses/biology11CellOrganellesSync';
import {
    biology12DnaStructureSteps,
    biology12MendelismSteps,
} from './courses/biology12GeneticsSync';
import {
    biology12EmbryogenesisSteps,
    biology12FertilizationSteps,
    biology12SexualReproductionSteps,
} from './courses/biology12ReproductionSync';
import { generateComprehensiveCourse } from '../services/contentGenerator';

// type CourseData = {
//     [key: string]: TeachingStep[];
// };

// const courses: CourseData = {
//     // Medicine - Cardiology
//     'ecg-basics': ecgBasicsSteps,
//     'heart-structure': heartStructureSteps,
//     'valves': valvesSteps,
//     'blood-flow': bloodFlowSteps,
//     'coronary-arteries': coronaryArteriesSteps,

//     // Medicine - Neurology
//     'brain-structure': brainStructureSteps,
//     'neurons': neuronsSteps,
//     'spinal-cord': spinalCordSteps,

//     // Engineering - Software
//     'react-basics': reactBasicsSteps,
//     'state-management': stateManagementSteps,
//     'sorting': sortingSteps,
//     'graphs': graphsSteps,
//     'api-design': apiDesignSteps,
//     'sql-basics': sqlBasicsSteps,

//     // Science - Physics
//     'newtons-laws': newtonsLawsSteps,
//     'kinematics': kinematicsSteps,

//     // Science - Biology
//     'dna-structure': dnaStructureSteps,
//     'heredity': hereditySteps,

//     // Business - Marketing
//     'seo': seoSteps,

//     // Business - Finance
//     'stocks': stocksSteps,

//     // Technology - AI
//     'supervised': supervisedSteps,

//     // Technology - Cybersecurity
//     'encryption': encryptionSteps,

//     // Law - Corporate
//     'contract-formation': contractFormationSteps,

//     // Education - Pedagogy
//     'active-learning': activeLearningSteps,

//     // Psychology - Clinical
//     'anxiety': anxietySteps,
// };

/**
 * Gets course content for a topic.
 * If pre-defined content exists, returns it.
 * Otherwise, generates comprehensive content using AI analysis.
 */
export const getCourseContent = async (
    topicId: string,
    topicName?: string,
    description?: string,
    subjectArea?: string,
    chapterName?: string,
    gradeName?: string,
    targetLanguage?: string
): Promise<TeachingStep[] | null> => {
    // Curated sync lesson: speech ↔ diagram highlights (see mitochondriaGrade11.ts)
    if (topicId === 'bio-11-8-mitochondria') {
        return mitochondriaGrade11Steps;
    }
    if (topicId === 'bio-12-1-sexual-reproduction') {
        return biology12SexualReproductionSteps;
    }
    if (topicId === 'bio-12-1-fertilization') {
        return biology12FertilizationSteps;
    }
    if (topicId === 'bio-12-1-embryogenesis') {
        return biology12EmbryogenesisSteps;
    }
    // Grade 11 — Cell: The Unit of Life (synced diagrams)
    if (topicId === 'bio-11-8-chloroplast') {
        return biology11ChloroplastSteps;
    }
    if (topicId === 'bio-11-8-prokaryotic-cell') {
        return biology11ProkaryoticCellSteps;
    }
    if (topicId === 'bio-11-8-cell-membrane') {
        return biology11CellMembraneSteps;
    }
    // Grade 12 — Genetics (synced diagrams)
    if (topicId === 'bio-12-2-mendelism') {
        return biology12MendelismSteps;
    }
    if (topicId === 'bio-12-2-dna-structure') {
        return biology12DnaStructureSteps;
    }

    // FORCE AI GENERATION:
    // We intentionally bypass the hardcoded 50-minute `courses` map here so that 
    // every topic receives the strict, 2-minute dynamically generated AI lesson.
    // if (courses[topicId]) {
    //     return courses[topicId];
    // }

    // If no pre-defined content, generate comprehensive course using AI analysis
    if (topicName) {
        try {
            const cacheKey = `${topicId}:${targetLanguage || ''}`;
            if (generatedCourseCache.has(cacheKey)) {
                return generatedCourseCache.get(cacheKey)!;
            }

            const generatedSteps = await generateComprehensiveCourse(
                topicId,
                topicName,
                description,
                subjectArea,
                chapterName,
                gradeName,
                targetLanguage
            );

            // Cache the generated content
            if (generatedSteps && generatedSteps.length > 0) {
                generatedCourseCache.set(cacheKey, generatedSteps);
                return generatedSteps;
            }
        } catch (error) {
            console.error(`Error generating content for topic ${topicId}:`, error);
        }
    }

    // Fallback to default steps
    return defaultSteps;
};

// Simple in-memory cache to store generated steps per topic & language combination
const generatedCourseCache = new Map<string, TeachingStep[]>();
