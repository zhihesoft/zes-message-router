/**
 * Guard function
 */
export interface SecurityGuard {
    (req: unknown): Promise<boolean>
}

