"use client";

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleX, Save, FileText, X } from 'lucide-react';

const inquiryTypes = [
	'Course Registration and Enlistment Issues', 
	'Shifting Inquiries', 
	'Application for Leave of Absence (LOA)', 
	'Request for Course Syllabi or Descriptions',
	'Academic Advising and Curriculum Inquiries',
	'Graduation Requirements and Clearance',
	'Course Withdrawals or Dropping Procedures',
	'Transferees: Credit Transfer and Accreditations'
];

// this is only shown to customers 
export default function CreateTicket() {
	const router = useRouter();
	const fileInputRef = useRef(null);

	const [subject, setSubject] = useState('');
	const [type, setType] = useState('');
	const [body, setBody] = useState('');
	const [attachments, setAttachments] = useState([]);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	function resetForm() {
		setSubject('');
		setType('');
		setBody('');
		setAttachments([]);
		setError('');
		setSuccess('');
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}

	function handleCancel() {
		resetForm();
		router.push('/dashboard');
	}

	function handleFilesSelected(event) {
		const files = Array.from(event.target.files || []);
		if (files.length === 0) return;
		setAttachments((prev) => [...prev, ...files.map((file) => file.name)]);
		event.target.value = '';
	}

	function removeAttachment(indexToRemove) {
		setAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError('');
		setSuccess('');

		if (!subject.trim() || !type.trim() || !body.trim()) {
			setError('All required fields must be filled in.');
			return;
		}

		setIsSubmitting(true);

		try {
			const res = await fetch('/api/tickets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subject: subject.trim(),
					type,
					body: body.trim(),
					attachments,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Ticket creation failed.');
			}

			const createdTicketId = String(data.ticketid ?? '').replace(/^#/, '');
			setSuccess(`Ticket ${data.ticketid} created successfully.`);

			if (createdTicketId) {
				router.push(`/tickets/${encodeURIComponent(createdTicketId)}`);
				router.refresh();
				return;
			}

			resetForm();
			router.refresh();
		} catch (err) {
			setError(err.message || 'Ticket creation failed.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<section className="min-h-[calc(100vh-3rem)]">
			<div className="w-full font-text text-foreground">
                {/* Header */}
                <h1 className="text-3xl font-bold mb-8">Create a Ticket</h1>
            </div>

			<div className="rounded-md border border-zinc-300 bg-div-gray px-8 py-9 shadow-sm sm:px-10">
				{(error || success) && (
					<div className={`mb-5 rounded-md px-4 py-3 text-sm font-medium ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
						{error || success}
					</div>
				)}

				<div className="mb-5 flex items-start justify-end">
					<button
						type="button"
						onClick={handleCancel}
						className="inline-flex items-center gap-2 text-lg text-zinc-500 transition hover:text-zinc-700"
					>
						<span>Cancel ticket</span>
						<CircleX className="h-5 w-5" />
					</button>
				</div>

				<form className="space-y-9" onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(180px,240px)_minmax(260px,460px)] md:items-center">
						<label htmlFor="subject" className="text-3xl font-medium text-zinc-700">
							Subject Header
						</label>
						<input
							id="subject"
							type="text"
							value={subject}
							onChange={(event) => setSubject(event.target.value)}
							placeholder="Enter Header"
							required
							className="h-11 w-full rounded-md border border-zinc-400 bg-zinc-100 px-4 text-base text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(180px,240px)_minmax(220px,300px)] md:items-center">
						<label htmlFor="inquiry" className="text-3xl font-medium text-zinc-700">
							Type of Inquiry
						</label>
						<select
							id="inquiry"
							value={type}
							onChange={(event) => setType(event.target.value)}
							required
							className="h-11 w-full appearance-none rounded-md border border-zinc-400 bg-zinc-100 px-4 pr-10 text-base text-zinc-500 focus:border-zinc-500 focus:outline-none"
							style={{
								backgroundImage:
									"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%23717171' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
								backgroundRepeat: 'no-repeat',
								backgroundSize: '1rem 1rem',
								backgroundPosition: 'right 0.75rem center',
							}}
						>
							<option value="" disabled>
								Select
							</option>
							{inquiryTypes.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</div>

					<div>
						<label htmlFor="body" className="mb-3 block text-3xl font-medium text-zinc-700">
							Ticket body
						</label>
						<textarea
							id="body"
							value={body}
							onChange={(event) => setBody(event.target.value)}
							rows={8}
							placeholder="Enter Body"
							required
							className="w-full rounded-md border border-zinc-400 bg-zinc-100 p-4 text-base text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
						/>
					</div>

					<div>
						<p className="mb-3 text-3xl font-medium text-zinc-700">Attachments</p>
						<div className="flex flex-col items-start gap-3">
							<input
								ref={fileInputRef}
								type="file"
								multiple
								onChange={handleFilesSelected}
								className="hidden"
							/>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="flex h-11 w-full max-w-70 items-center gap-2 rounded-md border border-zinc-400 bg-zinc-100 px-3 text-base text-zinc-400 transition hover:text-zinc-600"
							>
								<FileText className="h-5 w-5" />
								<span>Click to upload file...</span>
							</button>

							{attachments.map((fileName, index) => (
								<div
									key={`${fileName}-${index}`}
									className="flex h-11 w-full max-w-70 items-center justify-between rounded-md border border-zinc-400 bg-zinc-100 px-3 text-base text-zinc-500"
								>
									<span className="truncate">{fileName}</span>
									<button
										type="button"
										onClick={() => removeAttachment(index)}
										aria-label={`Remove uploaded file ${fileName}`}
										className="text-zinc-400 transition hover:text-zinc-600"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							))}
						</div>
					</div>

					<div className="flex justify-end pt-4">
						<button
							type="submit"
							disabled={isSubmitting}
							className="inline-flex h-11 items-center gap-2 rounded-md bg-tiggets-lightgreen px-5 text-base font-medium text-white transition hover:bg-[#2b4a3c]"
						>
							<Save className="h-5 w-5" />
							<span>{isSubmitting ? 'Saving...' : 'Save and Post'}</span>
						</button>
					</div>
				</form>
			</div>
		</section>
	);
}
