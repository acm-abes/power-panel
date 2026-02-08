/**
 * Performance Testing Utility
 * 
 * This script helps compare page load performance between
 * the original and optimized versions.
 * 
 * Usage in your page:
 * 1. Import this utility
 * 2. Wrap your data fetching with timing
 * 3. Check console logs for performance metrics
 */

export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number>;
  
  constructor(private label: string) {
    this.startTime = performance.now();
    this.marks = new Map();
  }
  
  mark(markName: string) {
    const currentTime = performance.now();
    const duration = currentTime - this.startTime;
    this.marks.set(markName, duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.label}] ${markName}: ${duration.toFixed(2)}ms`);
    }
  }
  
  end() {
    const totalDuration = performance.now() - this.startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.label}] Total: ${totalDuration.toFixed(2)}ms`);
      console.log('Breakdown:', Object.fromEntries(this.marks));
    }
    
    return totalDuration;
  }
  
  getMarks() {
    return Object.fromEntries(this.marks);
  }
}

// Usage example:
/*
export default async function MyTeamPage() {
  const timer = new PerformanceTimer('MyTeamPage');
  
  const session = await auth.api.getSession({ headers: await headers() });
  timer.mark('auth');
  
  const teamMembership = await getTeamMembership(session.user.id);
  timer.mark('team-query');
  
  const problemStatements = await getProblemStatements();
  timer.mark('problem-statements');
  
  timer.end();
  
  return <Page>...</Page>;
}
*/

/**
 * Database query timing wrapper
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB Query] ${queryName}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Compare two implementations
 */
export async function compareImplementations<T>(
  name1: string,
  impl1: () => Promise<T>,
  name2: string,
  impl2: () => Promise<T>
): Promise<void> {
  console.log(`\n=== Comparing: ${name1} vs ${name2} ===\n`);
  
  // Test implementation 1
  const start1 = performance.now();
  await impl1();
  const duration1 = performance.now() - start1;
  console.log(`${name1}: ${duration1.toFixed(2)}ms`);
  
  // Test implementation 2
  const start2 = performance.now();
  await impl2();
  const duration2 = performance.now() - start2;
  console.log(`${name2}: ${duration2.toFixed(2)}ms`);
  
  // Calculate improvement
  const improvement = ((duration1 - duration2) / duration1) * 100;
  console.log(`\nImprovement: ${improvement.toFixed(2)}%`);
  console.log(`Time saved: ${(duration1 - duration2).toFixed(2)}ms\n`);
}

/**
 * Log query result size
 */
export function logQuerySize(queryName: string, data: any) {
  if (process.env.NODE_ENV === 'development') {
    const size = JSON.stringify(data).length;
    const sizeKB = (size / 1024).toFixed(2);
    console.log(`[Query Size] ${queryName}: ${sizeKB} KB`);
  }
}

/**
 * Simplified timing for quick checks
 */
export function time<T>(label: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${label}] ${duration.toFixed(2)}ms`);
  }
  
  return result;
}
