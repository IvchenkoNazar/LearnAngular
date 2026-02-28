import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InterviewService } from '../../../shared/services/interview.service';
import { CandidateProfile } from '../../../shared/models';

@Component({
  selector: 'app-session-setup',
  imports: [
    RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
  ],
  templateUrl: './session-setup.html',
  styleUrl: './session-setup.scss',
})
export class SessionSetup {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private interviewService = inject(InterviewService);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    role: ['Angular Developer', Validators.required],
    yearsOfExperience: [2, [Validators.required, Validators.min(0)]],
    angularVersions: [['v17', 'v18']],
    mainResponsibilities: [''],
    techStack: [['Angular', 'TypeScript', 'RxJS']],
    proudestWork: [''],
    wantsToImprove: [''],
  });

  angularVersionOptions = ['v2', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10',
    'v11', 'v12', 'v13', 'v14', 'v15', 'v16', 'v17', 'v18', 'v19', 'v20', 'v21'];

  submit() {
    if (!this.form.valid) return;
    const candidate: CandidateProfile = this.form.value;
    const session = this.interviewService.startSession(candidate);
    this.router.navigate(['/conduct/session', session.id]);
  }
}
