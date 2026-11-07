import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { LICENCAS_POR_TIPO, licencaPermitida, TIPOS } from './lib/comunidade';

/** Projetos da comunidade: uma pasta por projeto em comunidade/<slug>/projeto.yml. */
const comunidade = defineCollection({
  loader: glob({
    base: './comunidade',
    pattern: '*/projeto.yml',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z
      .object({
        titulo: z.string().min(1).max(80),
        tipo: z.enum(TIPOS),
        autor: z.object({
          nome: z.string().min(1),
          github: z.string().optional(),
        }),
        descricao: z.string().min(1),
        licenca: z.string(),
        data: z.coerce.date(),
        capa: image(),
        fotos: z.array(image()).default([]),
        arquivos: z.array(z.string()).default([]),
        // Só http(s): um "javascript:" num link viraria script rodando no site.
        links: z
          .array(z.object({ titulo: z.string().min(1), url: z.url({ protocol: /^https?$/ }) }))
          .default([]),
        versao_firmware: z.string().optional(),
      })
      .superRefine((projeto, ctx) => {
        if (!licencaPermitida(projeto.tipo, projeto.licenca)) {
          ctx.addIssue({
            code: 'custom',
            path: ['licenca'],
            message: `Licença "${projeto.licenca}" não é aceita para o tipo "${projeto.tipo}". Use uma destas: ${LICENCAS_POR_TIPO[projeto.tipo].join(', ')}.`,
          });
        }
      }),
});

/** Docs: src/content/docs/<idioma>/<slug>.md. A chave liga as traduções de um mesmo doc. */
const docs = defineCollection({
  loader: glob({ base: './src/content/docs', pattern: '**/*.md' }),
  schema: z.object({
    titulo: z.string(),
    descricao: z.string(),
    chave: z.string(),
    ordem: z.number(),
    fonte: z.url().optional(),
  }),
});

export const collections = { comunidade, docs };
