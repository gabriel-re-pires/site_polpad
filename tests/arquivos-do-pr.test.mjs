import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { arquivosDoPR, conferirCaminhosDoPR } from '../scripts/validar-comunidade.mjs';

const temporarios = [];
afterEach(() => {
  for (const d of temporarios.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

describe('arquivosDoPR', () => {
  it('renomear um arquivo de fora para dentro da comunidade lista também o caminho antigo', () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-'));
    temporarios.push(repo);
    git(repo, 'init', '-q', '-b', 'main');
    git(repo, 'config', 'user.email', 't@t');
    git(repo, 'config', 'user.name', 't');
    fs.writeFileSync(path.join(repo, 'README.md'), 'conteúdo importante\n'.repeat(20));
    git(repo, 'add', '.');
    git(repo, 'commit', '-q', '-m', 'base');
    git(repo, 'checkout', '-q', '-b', 'pr');
    fs.mkdirSync(path.join(repo, 'comunidade', 'x'), { recursive: true });
    git(repo, 'mv', 'README.md', 'comunidade/x/README.md');
    git(repo, 'commit', '-q', '-m', 'pr');

    const arquivos = arquivosDoPR('main', repo);
    expect(arquivos).toContain('README.md');
    expect(conferirCaminhosDoPR(arquivos)).toHaveLength(1);
  });

  it('compara com o commit do PR mesmo com a base no checkout (pull_request_target)', () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-'));
    temporarios.push(repo);
    git(repo, 'init', '-q', '-b', 'main');
    git(repo, 'config', 'user.email', 't@t');
    git(repo, 'config', 'user.name', 't');
    fs.writeFileSync(path.join(repo, 'README.md'), 'base\n');
    git(repo, 'add', '.');
    git(repo, 'commit', '-q', '-m', 'base');
    git(repo, 'checkout', '-q', '-b', 'pr');
    fs.mkdirSync(path.join(repo, 'comunidade', 'x'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'comunidade', 'x', 'projeto.yml'), 'titulo: x\n');
    fs.writeFileSync(path.join(repo, 'README.md'), 'mexido\n');
    git(repo, 'add', '.');
    git(repo, 'commit', '-q', '-m', 'pr');
    git(repo, 'checkout', '-q', 'main');

    const arquivos = arquivosDoPR('main', repo, 'pr');
    expect(arquivos.sort()).toEqual(['README.md', 'comunidade/x/projeto.yml']);
  });
});
