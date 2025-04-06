import { withAuth } from '@/lib/auth';
import { ideasHandler } from '@/handlers/ideas';

export default withAuth(ideasHandler); 