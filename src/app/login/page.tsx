import { entrar, cadastrar } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-emerald-700">VICTA</h1>
          <p className="text-sm text-muted-foreground">Gestão Orçamentária de Obras</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acessar o sistema</CardTitle>
            <CardDescription>Ambiente de demonstração — dados fictícios.</CardDescription>
          </CardHeader>
          <CardContent>
            {erro && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="entrar">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="cadastrar">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar" className="mt-4">
                <form action={entrar} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-entrar">E-mail</Label>
                    <Input id="email-entrar" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha-entrar">Senha</Label>
                    <Input id="senha-entrar" name="senha" type="password" required autoComplete="current-password" />
                  </div>
                  <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800">
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="cadastrar" className="mt-4">
                <form action={cadastrar} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome-cadastro">Nome</Label>
                    <Input id="nome-cadastro" name="nome" required autoComplete="name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-cadastro">E-mail</Label>
                    <Input id="email-cadastro" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha-cadastro">Senha</Label>
                    <Input id="senha-cadastro" name="senha" type="password" required minLength={6} autoComplete="new-password" />
                  </div>
                  <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800">
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
