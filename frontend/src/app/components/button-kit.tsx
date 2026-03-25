import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';

type ButtonProps = React.ComponentProps<typeof Button>;

export function PrimaryButton({ className, ...props }: ButtonProps) {
  return <Button className={cn(className)} {...props} />;
}

export function SecondaryButton({ className, variant, ...props }: ButtonProps) {
  return <Button variant={variant ?? 'outline'} className={cn(className)} {...props} />;
}
