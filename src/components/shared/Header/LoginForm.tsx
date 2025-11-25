"use client";

import { login } from "@/actions/actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่าน")
    .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      const result = await login(formData);
      
      // หลังจาก login สำเร็จ ให้ refresh user data
      if (result?.success) {
        toast.success("Login successful");
        onLoginSuccess?.();
        // Reset form
        form.reset();
      }
    } catch (error) {
      // แสดง error message เมื่อ login ล้มเหลว
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 items-center gap-3"
      >
        <div className="flex flex-col gap-2.5 flex-1 max-w-md">
          {form.formState.errors.root && (
            <div className="text-xs text-destructive px-2">
              {form.formState.errors.root.message}
            </div>
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Email"
                    className={`rounded-full border-border/50 focus:border-primary transition-colors ${
                      form.formState.errors.email
                        ? "border-destructive focus:border-destructive"
                        : ""
                    }`}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs px-2" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="password"
                    className={`rounded-full border-border/50 focus:border-primary transition-colors ${
                      form.formState.errors.password
                        ? "border-destructive focus:border-destructive"
                        : ""
                    }`}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs px-2" />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 shadow-sm transition-all hover:shadow-md"
        >
          Login
        </Button>
      </form>
    </Form>
  );
}

