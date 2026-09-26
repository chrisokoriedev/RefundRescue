import { v4 as uuidv4 } from 'uuid';

export interface PlaybookVariant {
  id: string;
  name: string;
  scenario: string;
  prompt_template: string;
  weight: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

class PlaybookService {
  private playbooks: PlaybookVariant[] = [
    {
      id: uuidv4(),
      name: 'Default Empathy Variant',
      scenario: 'payment_failed',
      prompt_template: 'Hi {customerName}, I noticed your recent payment for the {planName} plan failed. I just wanted to reach out personally to make sure everything is okay and see if you needed any help updating your card.',
      weight: 100,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    }
  ];

  async getAllPlaybooks(): Promise<PlaybookVariant[]> {
    // Return only non-deleted playbooks
    return this.playbooks.filter(p => !p.deletedAt);
  }

  async getPlaybook(id: string): Promise<PlaybookVariant | undefined> {
    return this.playbooks.find(p => p.id === id && !p.deletedAt);
  }

  async createPlaybook(data: Partial<PlaybookVariant>): Promise<PlaybookVariant> {
    const now = new Date().toISOString();
    const playbook: PlaybookVariant = {
      id: uuidv4(),
      name: data.name || 'New Variant',
      scenario: data.scenario || 'payment_failed',
      prompt_template: data.prompt_template || '',
      weight: data.weight ?? 50,
      active: data.active ?? true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.playbooks.push(playbook);
    return playbook;
  }

  async updatePlaybook(id: string, data: Partial<PlaybookVariant>): Promise<PlaybookVariant | null> {
    const idx = this.playbooks.findIndex(p => p.id === id && !p.deletedAt);
    if (idx === -1) return null;
    this.playbooks[idx] = {
      ...this.playbooks[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.playbooks[idx];
  }

  /** Soft delete — sets deletedAt instead of removing */
  async deletePlaybook(id: string): Promise<boolean> {
    const playbook = this.playbooks.find(p => p.id === id && !p.deletedAt);
    if (!playbook) return false;
    playbook.deletedAt = new Date().toISOString();
    playbook.updatedAt = new Date().toISOString();
    return true;
  }

  async selectActivePlaybookVariant(scenario: string): Promise<PlaybookVariant | null> {
    const activeVariants = this.playbooks.filter(
      p => p.scenario === scenario && p.active && !p.deletedAt
    );
    if (activeVariants.length === 0) return null;
    if (activeVariants.length === 1) return activeVariants[0];

    // Weighted random selection for A/B test
    const totalWeight = activeVariants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const variant of activeVariants) {
      if (random < variant.weight) {
        return variant;
      }
      random -= variant.weight;
    }
    
    return activeVariants[0];
  }
}

export const playbookService = new PlaybookService();
